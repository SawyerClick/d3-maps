import * as d3 from 'd3'
import * as topojson from 'topojson'

const margin = { top: 0, left: 10, right: 10, bottom: 0 }

const height = 275 - margin.top - margin.bottom
const width = 275 - margin.left - margin.right

const container = d3.select('#chart-6')

const projection = d3.geoAlbersUsa()
const path = d3.geoPath().projection(projection)

const colorScale = d3.scaleOrdinal(d3.schemeSet3)

const radiusScale = d3.scaleSqrt().range([1, 5])

Promise.all([
  d3.json(require('/data/us_states.topojson')),
  d3.csv(require('/data/powerplants.csv'))
])
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready([json, datapoints]) {
  const states = topojson.feature(json, json.objects.us_states)
  projection.fitSize([width, height], states)

  const output = datapoints.map(d => d.Total_MW)
  radiusScale.domain(d3.extent(output))

  const nested = d3
    .nest()
    .key(d => d.PrimSource)
    .entries(datapoints)
  // console.log(nested)

  container
    .selectAll('graphs')
    .data(nested)
    .enter()
    .append('svg')
    .style('display', 'flexbox')
    .attr('height', height + margin.top + margin.bottom)
    .attr('width', width + margin.left + margin.right)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .each(function(d) {
      const svg = d3.select(this)
      const datapoints = d.values
      projection.fitSize([width, height], states)

      svg
        .selectAll('states')
        .data(states.features)
        .enter()
        .append('path')
        .attr('class', 'state')
        .attr('d', path)
        .attr('fill', '#e8e8e8')
        .attr('stroke', 'none')

      svg
        .selectAll('circle')
        .data(datapoints)
        .enter()
        .append('circle')
        .attr('class', 'plant')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', d => radiusScale(d.Total_MW))
        .attr('transform', function(d) {
          const coords = projection([d.Longitude, d.Latitude])
          return `translate(${coords})`
        })
        .attr('fill', function(d) {
          if (d.PrimSource === 'other') {
            return 'gray'
          } else {
            return colorScale(d.PrimSource)
          }
        })
        .attr('opacity', 0.6)
        .attr('id', d => d.PrimSource)

      svg
        .append('text')
        .text(d.key.charAt(0).toUpperCase() + d.key.slice(1))
        .attr('x', width / 2)
        .attr('y', 50)
        .style('font-size', 18)
        .style('font-weight', 600)
        .attr('text-anchor', 'middle')
        .attr('text-alignment', 'middle')
        .attr('align-baseline', 'middle')
    })
}
