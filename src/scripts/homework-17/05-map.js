import * as d3 from 'd3'
import * as topojson from 'topojson'

const margin = { top: 0, left: 32, right: 0, bottom: 0 }

const height = 600 - margin.top - margin.bottom
const width = 900 - margin.left - margin.right

const svg = d3
  .select('#chart-5')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

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
  // console.log(json)

  const output = datapoints.map(d => d.Total_MW)
  radiusScale.domain(d3.extent(output))

  const plantTypes = datapoints.map(d => d.PrimSource)
  const nested = d3
    .nest()
    .key(d => d)
    .entries(plantTypes)
  // console.log(nested)

  svg
    .selectAll('path')
    .data(states.features)
    .enter()
    .append('path')
    .attr('class', 'state')
    .attr('fill', '#e8e8e8')

  svg
    .selectAll('circle')
    .data(datapoints)
    .enter()
    .append('circle')
    .attr('class', 'plant')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', d => radiusScale(d.Total_MW))
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
    .selectAll('state-names')
    .data(states.features)
    .enter()
    .append('text')
    .attr('class', 'state-names')
    .text(function(d) {
      return d.properties.abbrev
    })
    .attr('transform', function(d) {
      return `translate(${path.centroid(d)})`
    })
    .attr('text-anchor', 'middle')
    .attr('text-alignment', 'middle')
    .attr('align-baseline', 'middle')
    .style('font-size', 12)
    .style('font-weight', 600)
    .style(
      'text-shadow',
      '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff'
    )

  const legend = svg
    .append('g')
    .attr('transform', 'translate(-25, 25)')
    .attr('class', 'legend')

  legend
    .selectAll('.legend-row')
    .data(nested)
    .enter()
    .append('g')
    .attr('y', 0)
    .attr('transform', (d, i) => `translate(0,${i * 30})`)
    .attr('class', 'legend-row')
    .each(function(d) {
      const g = d3.select(this)

      g.append('circle')
        .attr('r', 7)
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('fill', colorScale(d.key))

      g.append('text')
        .text(d.key.charAt(0).toUpperCase() + d.key.slice(1))
        .attr('dx', 15)
        .attr('dy', 1)
        .attr('fill', 'black')
        .attr('alignment-baseline', 'middle')
        .attr('text-alignment', 'middle')
    })

  function render() {
    const svgContainer = svg.node().closest('div')
    const svgWidth = svgContainer.offsetWidth
    const svgHeight = height + margin.top + margin.bottom

    const actualSvg = d3.select(svg.node().closest('svg'))
    actualSvg.attr('width', svgWidth).attr('height', svgHeight)

    const newWidth = svgWidth - margin.left - margin.right
    const newHeight = svgHeight - margin.top - margin.bottom

    // Update the scale
    projection.scale(newWidth).translate([newWidth / 2, newHeight / 2])

    // Update things you draw
    svg.selectAll('.state').attr('d', path)
    svg.selectAll('.state-names').attr('transform', function(d) {
      return `translate(${path.centroid(d)})`
    })
    svg
      .select('.legend')
      .attr('transform', `translate(-25, ${newHeight * 0.2})`)
    svg.selectAll('.plant').attr('transform', function(d) {
      const coords = projection([d.Longitude, d.Latitude])
      return `translate(${coords})`
    })
  }
  window.addEventListener('resize', render)
  render()
}
