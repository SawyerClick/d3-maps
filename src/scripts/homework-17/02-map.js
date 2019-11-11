import * as d3 from 'd3'
import * as topojson from 'topojson'

const margin = { top: 20, left: 20, right: 20, bottom: 20 }

const height = 500 - margin.top - margin.bottom

const width = 700 - margin.left - margin.right

const svg = d3
  .select('#chart-2')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

// Configuration for the spinning effect
const time = Date.now()
const rotate = [0, -30]
const velocity = [0.002, 0]

// set projection type and paremetes
const projection = d3
  .geoOrthographic()
  .scale(width / 2.1)
  .translate([width / 2 + 100, height / 2])
  .clipAngle(90)
  .precision(0.3)

const path = d3.geoPath().projection(projection)
const graticule = d3.geoGraticule().step([10, 10])

const coordinateStore = d3.map()

Promise.all([
  d3.json(require('/data/world.topojson')),
  d3.csv(require('/data/airport-codes-subset.csv')),
  d3.csv(require('/data/flights.csv'))
])
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready([json, airports, flights]) {
  airports.forEach(d => {
    const name = d.iata_code
    const coords = [+d.longitude, +d.latitude]
    coordinateStore.set(name, coords)
  })

  const countries = topojson.feature(json, json.objects.countries)

  projection.fitSize([width, height], countries)

  svg
    .selectAll('flights')
    .data(coordinateStore)
    .enter()
    .append('path')

  svg
    .append('path')
    .datum({ type: 'Sphere' })
    .attr('d', path)
    .attr('fill', 'none')
    .attr('stroke', 'none')

  svg
    .append('path')
    .datum(graticule)
    .attr('class', 'graticule')
    .attr('d', path)
    .style('fill', '#fff')
    .style('stroke', '#ccc')

  svg
    .selectAll('countries')
    .data(countries.features)
    .enter()
    .append('path')
    .attr('class', 'country')
    .attr('d', path)
    .attr('fill', 'gray')
    .attr('opacity', 1)
    .attr('stroke', 'whitesmoke')
    .attr('stroke-width', 0.1)

  svg
    .selectAll('circle')
    .data(airports)
    .enter()
    .append('circle')
    .attr('class', 'airports')
    .attr('id', d => d.iata_code)
    .attr('r', 2)
    .attr('fill', 'indianred')
    .attr('opacity', 0.9)
    .attr('transform', function(d) {
      const coords = projection([d.longitude, d.latitude])
      return `translate(${coords})`
    })
    .on('mouseover', function(d) {
      svg.selectAll('.flight').attr('stroke-width', 0)
      svg.select('path#' + d.iata_code).attr('stroke-width', 5)

      console.log(d.iata_code)

      svg.selectAll('circle.airports').attr('r', 0)
      svg.select('circle#' + d.iata_code).attr('r', 10)
    })
    .on('mouseout', function(d) {
      svg.selectAll('.flight').attr('stroke-width', 0.6)
      svg.selectAll('circle.airports').attr('r', 2)
    })

  svg
    .selectAll('.flight')
    .data(flights)
    .enter()
    .append('path')
    .attr('class', 'flight')
    .attr('id', d => d.code)
    .attr('d', d => {
      const fromCoords = [-73.78, 40.64]
      const toCoords = coordinateStore.get(d.code)

      const geoLine = {
        type: 'LineString',
        coordinates: [fromCoords, toCoords]
      }
      return path(geoLine)
    })
    .attr('fill', 'none')
    .attr('stroke', 'peachpuff')
    .attr('stroke-width', 0.6)
    .attr('opacity', 0.8)
    .attr('stroke-linecap', 'round')
    .on('mouseover', function(d) {
      svg.selectAll('.flight').attr('stroke-width', 0)
      svg.select('path#' + d.code).attr('stroke-width', 5)

      svg.selectAll('circle.airports').attr('r', 0)
      svg.select('circle#' + d.code).attr('r', 10)
    })
    .on('mouseout', function(d) {
      svg.selectAll('.flight').attr('stroke-width', 0.6)
      svg.selectAll('circle.airports').attr('r', 2)
    })

  spinningGlobe()

  function spinningGlobe() {
    d3.timer(function() {
      const dt = Date.now() - time

      projection.rotate([
        rotate[0] + velocity[0] * dt,
        rotate[1] + velocity[1] * dt
      ])

      svg.selectAll('path.country').attr('d', path)
      svg.selectAll('path.graticule').attr('d', path)
      svg.selectAll('path.flight').attr('d', d => {
        const fromCoords = [-73.78, 40.64]
        const toCoords = coordinateStore.get(d.code)

        const geoLine = {
          type: 'LineString',
          coordinates: [fromCoords, toCoords]
        }

        return path(geoLine)
      })
      svg
        .selectAll('circle.airports')
        .attr('transform', function(d) {
          const coords = projection([d.longitude, d.latitude])
          return `translate(${coords})`
        })
        .attr('fill', 'peachpuff')
    })
  }
}
