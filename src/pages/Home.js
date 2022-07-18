import React, { useState, useEffect } from 'react';
import { Container, Row } from 'react-bootstrap';
import { Select, Table, Radio, Spin } from 'antd';
import Plot from 'react-plotly.js';
import axios from 'axios';
import moment from 'moment';

const { Option } = Select;

const baseUrl = 'https://api.exchangerate.host/latest?base=ZAR';
const timeSeriesUrl = 'https://api.exchangerate.host/timeseries?base=ZAR';
const requiredCurrencies = [ 'USD', 'EUR', 'GBP', 'HKD', 'KES' ];

const columns = [
	{
		title: 'Currency',
		dataIndex: 'currency'
	},
	{
		title: 'Amount',
		dataIndex: 'amount'
	}
];

// Todo Containerize app
// Todo Show "graph"

export default function Home() {
	const [ exchangeRates, setExchangeRates ] = useState([]);
	const [ timeRemaining, setTimeRemaining ] = useState(0);
	const [ toCurrency, setToCurrency ] = useState('USD');
	const [ loading, setLoading ] = useState(false);
	const [ timeSeriesData, setTimeSeriesData ] = useState(null);
	const [ period, setPeriod ] = useState('1d');

	useEffect(() => {
		let interval = setInterval(() => {
			setTimeRemaining((prevTime) => {
				if (prevTime === 300) {
					fetchData();
					return 0;
				}
				return prevTime + 1;
			});
		}, 1000);
		return () => {
			clearInterval(interval);
		};
	}, []);

	const showTimeRemaining = () => {
		const updateSecs = 300 - timeRemaining;
		let timeString = `${(updateSecs / 60) | 0}:${updateSecs % 60}`;
		return `${timeString} until next update`;
	};

	useEffect(() => {
		fetchData();
		fetchTimeSeriesData(moment().subtract(1, 'day').format('YYYY-MM-DD'));
	}, []);

	const fetchData = () => {
		axios
			.get(baseUrl)
			.then((res) => {
				const rates = [
					{
						key: 'ZAR',
						currency: 'ZAR',
						amount: 1
					}
				];
				requiredCurrencies.forEach((currency) =>
					rates.push({ key: currency, currency, amount: res.data.rates[currency] })
				);

				setExchangeRates([ ...rates ]);
			})
			.catch((err) => console.log(`Encountered error: ${err}`));
	};

	const handleCurrencyChange = (value) => {
		setLoading(true);
		const newValue = value;
		setToCurrency(newValue);
		setPeriod('1d');
		fetchTimeSeriesData(moment().subtract(1, 'day').format('YYYY-MM-DD'));
		setLoading(false);
	};

	const fetchTimeSeriesData = (prev) => {
		setLoading(true);
		axios
			.get(`${timeSeriesUrl}&start_date=${prev}&end_date=${moment().format('YYYY-MM-DD')}`)
			.then((res) => {
				setTimeSeriesData(res.data.rates);
				setLoading(false);
			})
			.catch((err) => console.log(err));
	};

	const handleTimeChange = (e) => {
		setLoading(true);
		const time = e.target.value;
		setPeriod(time);
		var previous;

		switch (time) {
			case '1d':
				previous = moment().subtract(1, 'day').format('YYYY-MM-DD');
				break;
			case '1w':
				previous = moment().subtract(1, 'week').format('YYYY-MM-DD');
				break;
			case '1m':
				previous = moment().subtract(1, 'month').format('YYYY-MM-DD');
				break;
			case '1y':
				previous = moment().subtract(1, 'year').format('YYYY-MM-DD');
				break;
			case '2y':
				previous = moment().subtract(2, 'year').format('YYYY-MM-DD');
				break;
			case '5y':
				previous = moment().subtract(5, 'year').format('YYYY-MM-DD');
				break;
			case '10y':
				previous = moment().subtract(10, 'year').format('YYYY-MM-DD');
				break;
			default:
				previous = moment().subtract(1, 'day').format('YYYY-MM-DD');
				break;
		}

		fetchTimeSeriesData(previous);
		setLoading(false);
    };
    
    const getPlotData = () => {
        const dataToPlot = [
			{
				x: [],
				y: [],
				type: 'scatter',
				mode: 'lines+markers',
				marker: { color: 'blue' },
				useResizeHandler: true,
				style: { width: '100%', height: '100%' }
			}
		];
		for (var date in timeSeriesData) {
			dataToPlot[0].x.push(date);
			dataToPlot[0].y.push(timeSeriesData[date][toCurrency]);
		}
        
        return dataToPlot;
    }

	return (
		<Container>
			<Row>
				<h4 className="mt-2 mb-2 pull-right">{showTimeRemaining()}</h4>
			</Row>
			<Row className="mt-2">
				<Table columns={columns} dataSource={exchangeRates} pagination={false} />
			</Row>
			<Row className="mt-2 mb-2">
				<Select defaultValue="USD" style={{ width: 150 }} onChange={handleCurrencyChange}>
					{requiredCurrencies.map((currency) => (
						<Option key={currency} value={currency}>
							{currency}
						</Option>
					))}
				</Select>
			</Row>
			<Row>
				<Radio.Group onChange={handleTimeChange} defaultValue="1d" value={period}>
					<Radio.Button value="1d">1D</Radio.Button>
					<Radio.Button value="1w">1W</Radio.Button>
					<Radio.Button value="1m">1M</Radio.Button>
					<Radio.Button value="1y">1Y</Radio.Button>
					<Radio.Button value="2y">2Y</Radio.Button>
					<Radio.Button value="5y">5Y</Radio.Button>
					<Radio.Button value="10y">10Y</Radio.Button>
				</Radio.Group>
			</Row>
			<Row>
				{loading === true ? (
					<Spin />
				) : (
					<Plot
						data={getPlotData()}
						layout={{ title: `ZAR to ${toCurrency} Chart`, autosize: true }}
						useResizeHandler={true}
						style={{ width: '100%', height: '100%' }}
					/>
				)}
			</Row>
		</Container>
	);
}
