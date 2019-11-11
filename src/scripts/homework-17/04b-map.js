import * as d3 from 'd3'
import * as topojson from 'topojson'
import d3Tip from 'd3-tip'
d3.tip = d3Tip

const margin = { top: 0, left: 0, right: 0, bottom: 0 }

const height = 500 - margin.top - margin.bottom

const width = 900 - margin.left - margin.right

const svg = d3
  .select('#chart-4b')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const projection = d3.geoAlbersUsa()
const graticule = d3.geoGraticule()
const path = d3.geoPath().projection(projection)

const colorScale = d3.scaleSequential(d3.interpolatePiYG)

const opacityScale = d3
  .scaleLinear()
  .domain([0, 80000])
  .range([0, 1])
  .clamp(true)

const tip = d3
  .tip()
  // .append('div')
  .attr('class', 'tooltip')
  .offset([0, 0])
  .style('background-color', '#fefefebb')
  .style('padding', '5px 10px')
  .style('border-radius', '10px')
  .html(function(d) {
    if (d.properties.clinton > d.properties.trump) {
      const total = d.properties.clinton + d.properties.trump
      const percent = (d.properties.clinton / total) * 100
      return `<h6>${d.properties.name} County, ${
        d.properties.state
      }<br><strong style='color:purple;'>Clinton</strong> with ${d3.format(
        '.0f'
      )(percent)}%</h6>`
    } else {
      if (d.properties.trump > d.properties.clinton) {
        const total = d.properties.clinton + d.properties.trump
        const percent = (d.properties.trump / total) * 100
        return `<h6>${d.properties.name} County, ${
          d.properties.state
        }<br><strong style='color:green'>Trump</strong> with ${d3.format('.0f')(
          percent
        )}%</h6>`
      }
    }
  })

d3.json(require('/data/counties_with_election_data.topojson'))
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready(json) {
  const counties = topojson.feature(json, json.objects.us_counties)
  // console.log(counties)

  svg.call(tip)

  svg
    .selectAll('path')
    .data(counties.features)
    .enter()
    .append('path')
    .attr('class', 'county')
    .attr('d', path)
    .attr('fill', d => {
      if (d.properties.clinton > d.properties.trump) {
        return 'purple'
      } else if (d.properties.trump > d.properties.clinton) {
        return 'green'
      } else {
        return 'whitesmoke'
      }
    })
    .attr('opacity', function(d) {
      if (d.properties.state) {
        const totalVotes = d.properties.clinton + d.properties.trump
        return opacityScale(totalVotes)
      }
      return 1
    })
    .attr('stroke', 'none')
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide)

  function render() {
    const svgContainer = svg.node().closest('div')
    const svgWidth = svgContainer.offsetWidth
    const svgHeight = height + margin.top + margin.bottom

    const actualSvg = d3.select(svg.node().closest('svg'))
    actualSvg.attr('width', svgWidth).attr('height', svgHeight)

    const newWidth = svgWidth - margin.left - margin.right
    const newHeight = svgHeight - margin.top - margin.bottom

    // Update our scale
    projection.fitSize([newWidth, newHeight], counties)

    // Update things you draw
    svg.selectAll('.county').attr('d', path)
  }

  window.addEventListener('resize', render)
  render()
}
