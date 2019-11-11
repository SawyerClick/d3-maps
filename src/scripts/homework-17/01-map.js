import * as d3 from 'd3'
import * as topojson from 'topojson'

const margin = { top: 0, left: 0, right: 0, bottom: 0 }

const height = 500 - margin.top - margin.bottom

const width = 900 - margin.left - margin.right

const svg = d3
  .select('#chart-1')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  // .attr('viewBox', [0, 0, width, height])
  .style('background-color', '#111111')
  .on('dblclick', reset)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

function reset() {
  svg
    .transition()
    .duration(250)
    .call(
      zoom.transform,
      d3.zoomIdentity,
      d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
    )
  // console.log('reset')
}

function clicked(d) {
  const [[x0, y0], [x1, y1]] = path.bounds(d)
  d3.event.stopPropagation()
  svg
    .transition()
    .duration(750)
    .ease(d3.easeQuad)
    .call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(
          Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height))
        )
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
      d3.mouse(svg.node())
    )

  d3.select(this).attr('stroke', 'white')
}

function zoomed() {
  const { transform } = d3.event
  svg.attr('transform', transform)
  svg.attr('stroke-width', 1 / transform.k)
}

const projection = d3.geoMercator()
const graticule = d3.geoGraticule()
const path = d3.geoPath().projection(projection)

const colorScale = d3.scaleSequential(d3.interpolateInferno).clamp(true)

const zoom = d3
  .zoom()
  .scaleExtent([1, 8])
  .on('zoom', zoomed)

Promise.all([
  d3.json(require('/data/world.topojson')),
  d3.csv(require('/data/world-cities.csv'))
])
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready([json, datapoints]) {
  // boiling it down to the array I need
  const countries = topojson.feature(json, json.objects.countries)
  // console.log(countries)

  const pop = datapoints.map(d => d.population)
  colorScale.domain(d3.extent(pop))
  // console.log(colorScale.domain())

  svg
    .append('path')
    .datum(graticule())
    .attr('d', path)
    .attr('class', 'lines')
    .attr('stroke', '#A47AC6')
    .attr('stroke-width', 0.5)
    .attr('fill', 'none')
    .lower()

  svg
    .selectAll('path')
    .data(countries.features)
    .enter()
    .append('path')
    .attr('class', 'country')
    .attr('d', path)
    .attr('fill', '#111111')
    .attr('fill-opacity', 1)
    .attr('stroke', '#333333')
    .attr('stroke-width', 1)
    .on('mouseover', function(d) {
      d3.select(this)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('fill', '#322456')

      svg.selectAll('.country-name').remove()

      svg
        .append('text')
        .attr('class', 'country-name')
        .text(function() {
          return d.properties.name
        })
        .attr('x', 20)
        .attr('y', height * 0.85)
        .attr('dy', 50)
        .attr('dy', 50)
        .attr('text-anchor', 'start')
        .attr('text-alignment', 'middle')
        .attr('align-baseline', 'middle')
        .attr('fill', 'white')
        .style('font-size', 22)
        .style('font-family', 'Orbitron')
        .style('background-color', 'black')
    })
    .on('mouseout', function(d) {
      d3.select(this)
        .attr('stroke', '#333333')
        .attr('stroke-width', 1)
        .attr('fill', '#111111')
    })
    .on('click', clicked)

  svg
    .selectAll('circle')
    .data(datapoints)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('transform', function(d) {
      const coords = projection([d.lng, d.lat])
      return `translate(${coords})`
    })
    .attr('r', 1)
    .attr('fill', d => colorScale(d.population))

  function render() {
    const svgContainer = svg.node().closest('div')
    const svgWidth = svgContainer.offsetWidth
    const svgHeight = height + margin.top + margin.bottom

    const actualSvg = d3.select(svg.node().closest('svg'))
    actualSvg.attr('width', svgWidth).attr('height', svgHeight)

    const newWidth = svgWidth - margin.left - margin.right
    const newHeight = svgHeight - margin.top - margin.bottom

    // Update the scale
    projection.scale(newWidth / 5).translate([newWidth / 2, newHeight / 2])

    // Update things you draw
    svg.selectAll('.country').attr('d', path)
    svg.selectAll('.dot').attr('transform', function(d) {
      const coords = projection([d.lng, d.lat])
      return `translate(${coords})`
    })
    svg
      .selectAll('.lines')
      .datum(graticule())
      .attr('d', path)
  }
  window.addEventListener('resize', render)
  render()

  svg.call(zoom)

  return svg.node()
}
