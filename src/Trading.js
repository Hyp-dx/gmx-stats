import React, { useEffect, useState, useCallback, useMemo } from 'react';
import * as ethers from 'ethers'
import * as strftime from 'strftime'

import { useRequest, urlWithParams } from './helpers'

import {
  LineChart,
  BarChart,
  Line,
  Bar,
  Label,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  ReferenceLine,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';

const { BigNumber } = ethers
const { formatUnits} = ethers.utils

function Trading() {
  const [from, setFrom] = useState(new Date(Date.now() - 86400000 * 3).toISOString().slice(0, -5))
  const [to, setTo] = useState(new Date().toISOString().slice(0, -5))

  const fromTs = +new Date(from) / 1000
  const toTs = +new Date(to) / 1000

  const btcData = useRequest(urlWithParams(`/api/prices/BTC`, {from: fromTs, to: toTs}), [])
  const ethData = useRequest(urlWithParams(`/api/prices/ETH`, {from: fromTs, to: toTs}), [])
  const bnbData = useRequest(urlWithParams(`/api/prices/BNB`, {from: fromTs, to: toTs}), [])

  const assetChartData = useMemo(() => {
    const all = {}
    const options = [
      ['BTC', btcData],
      ['ETH', ethData],
      ['BNB', bnbData]
    ]

    options.forEach(([name, assetData]) => {
      if (!assetData) {
        return
      }
      let maxPrice = 0
      let minPrice = Infinity
      all[name] = {
        data: assetData.map(item => {
          const price = item.price / 1e8
          if (price > maxPrice) {
            maxPrice = price
          }
          if (price < minPrice) {
            minPrice = price
          }
          return {
            date: new Date(item.timestamp * 1000),
            price: price,
            poolAmount: item.poolAmount
          }
        })
      }
      all[name].maxPrice = maxPrice
      all[name].minPrice = minPrice
    })

    return all
  }, [btcData, ethData, bnbData])

  const pnlData = useRequest(urlWithParams('/api/marginPnl', {from: fromTs, to: toTs}), [])
  const pnlChartData = useMemo(() => {
    return pnlData.map(item => {
      return {
        date: new Date(item.timestamp * 1000),
        net: item.metrics.net,
        profits: item.metrics.profits,
        loss: item.metrics.loss,
        long: item.metrics.long,
        short: item.metrics.short,
      } 
    })
  }, [pnlData])
  const pnlMin = pnlChartData.length ? pnlChartData[pnlChartData.length - 1].loss : 0
  const pnlMax = pnlChartData.length ? pnlChartData[pnlChartData.length - 1].profits : 0

  const liquidationsData = useRequest(urlWithParams('api/liquidations', {from: fromTs, to: toTs}), [])
  const liquidationsChartData = useMemo(() => {
  	let cum = 0
  	let longCum = 0
  	let shortCum = 0
  	return liquidationsData.map(item => {
  		cum += item.collateral
  		if (item.isLong) {
  			longCum += item.collateral
  		} else {
  			shortCum += item.collateral
  		}
  		return {
  			date: new Date(item.timestamp * 1000),
  			collateral: cum,
  			long: longCum,
  			short: shortCum
  		}
  	})
  }, [liquidationsData])

  return (
    <>
			<div>
				<p>
					<label>From</label>
					<input type="datetime-local" value={from} onChange={evt => setFrom(evt.target.value)} />
				</p>
				<p>
					<label>To</label>
					<input type="datetime-local" value={to} onChange={evt => setTo(evt.target.value)} />
				</p>
			</div> 		 
      {Object.entries(assetChartData).map(([name, {data, maxPrice, minPrice}]) => {
        return <div key={name}>
          <h2>{name}</h2>
          <ResponsiveContainer width="100%" height={600}>
            <ComposedChart
              data={data}
            >
              <CartesianGrid strokeDasharray="10 10" />
              <XAxis dataKey="date" />
              <YAxis
                yAxisId="left"
                dataKey="price"
                domain={[Math.round(minPrice * 0.99), Math.round(maxPrice * 1.01)]}
              />
              <YAxis yAxisId="right" orientation="right" dataKey="poolAmount" />
              <Tooltip />
              <Legend />
              <Area isAnimationActive={false} strokeWidth={0} yAxisId="right" dataKey="poolAmount" name="Pool" dot={false} fill="#eb8334" />
              <Line isAnimationActive={false} yAxisId="left" dataKey="price" name="Chainlink Price" dot={false} stroke="#666" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      })}

      <h2>Liquidated Collateral</h2>
      <ResponsiveContainer width="100%" height={600}>
        <ComposedChart
          data={liquidationsChartData}
        >
          <CartesianGrid strokeDasharray="10 10" />
          <XAxis dataKey="date" />
          <YAxis dataKey="collateral" />
          <Tooltip />
          <Legend />
          <Area isAnimationActive={false} stackId="a" dataKey="long" name="Long" dot={false} strokeWidth={0} stroke="purple" fill="purple" />
          <Area isAnimationActive={false} stackId="a" dataKey="short" name="Short" dot={false} stroke="green" strokeWidth={0} fill="green" />
          <Line isAnimationActive={false} dataKey="collateral" name="All" dot={false} stroke="black" strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>

      <h2>Global PnL</h2>
      <ResponsiveContainer width="100%" height={600}>
        <ComposedChart
          data={pnlChartData}
        >
          <CartesianGrid strokeDasharray="10 10" />
          <XAxis dataKey="date" />
          <YAxis domain={[pnlMin * 1.5, pnlMax * 0.50]} />
          <Tooltip />
          <Legend />
          <Area isAnimationActive={false} dataKey="profits" name="Profits" dot={false} strokeWidth={0} fill="lightblue" />
          <Area isAnimationActive={false} dataKey="loss" name="Loss" dot={false} strokeWidth={0} fill="red" />
          <Line isAnimationActive={false} dataKey="net" name="Net" dot={false} stroke="#000" strokeWidth={2} />
          <Line isAnimationActive={false} dataKey="long" name="Longs Net" dot={false} stroke="green" strokeWidth={2} />
          <Line isAnimationActive={false} dataKey="short" name="Shorts Net" dot={false} stroke="purple" strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </>
  )
}

export default Trading