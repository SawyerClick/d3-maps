import * as d3 from 'd3'
import * as turf from '@turf/turf'
import polylabel from 'polylabel'

const margin = { top: 0, left: 0, right: 0, bottom: 0 }
const height = 440 - margin.top - margin.bottom
const width = 700 - margin.left - margin.right

const svg = d3
  .select('#chart-3')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const colorScale = d3.scaleSequential(d3.interpolateYlGnBu)

const line = d3.line()
const path = d3.geoPath()

Promise.all([
  d3.xml(require('/images/canada.svg')),
  d3.csv(require('/data/wolves.csv'))
])
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready([hexFile, datapoints]) {
  const wolvesCount = datapoints.map(d => +d.wolves)
  colorScale.domain(d3.extent(wolvesCount))

  const imported = d3.select(hexFile).select('svg')
  imported.selectAll('style').remove()
  svg.html(imported.html())

  datapoints.forEach(d => {
    svg
      .select('#' + d.abbreviation)
      .attr('class', 'hex-group')
      .each(function() {
        const group = d3.select(this).datum(d)

        group.selectAll('polygon').attr('fill', colorScale(+d.wolves))
      })
  })

  // outline and hovers
  svg
    .selectAll('.hex-group')
    .each(function(d) {
      const group = d3.select(this)

      const polygons = group
        .selectAll('polygon')
        .nodes()
        .map(function(node) {
          return node.getAttribute('points').trim()
        })
        .map(function(pointString) {
          const regex = /(([\d/.]+)[ ,]([\d/.]+))/g
          return pointString.match(regex).map(function(pair) {
            const coords = pair.split(/[ ,]/)
            return [+coords[0], +coords[1]]
          })
        })
        .map(function(coords) {
          coords.push(coords[0])
          return turf.polygon([coords])
        })

      const merged = turf.union(...polygons)

      group
        .append('path')
        .datum(merged)
        .attr('class', 'outline')
        .attr('d', path)
        .attr('stroke', 'black')
        .attr('stroke-width', 2)
        .attr('fill', 'none')

      const center = polylabel(merged.geometry.coordinates)

      group
        .append('text')
        .attr('class', 'outline')
        .attr('transform', `translate(${center})`)
        .text(d.abbreviation)
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .attr('font-weight', 'bold')
        .attr('font-size', 20)
        .style(
          'text-shadow',
          '-1px -1px 0 lightgray, 1px -1px 0 lightgray, -1px 1px 0 lightgray, 1px 1px 0 lightgray'
        )
    })
    .on('mouseover', function(d) {
      d3.select(this)
        .selectAll('polygon')
        .attr('opacity', 0.3)
    })
    .on('mouseout', function(d) {
      d3.select(this)
        .selectAll('polygon')
        .attr('opacity', 1)
    })
}
