import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';
import './Ping.css';
const ping = require('web-pingjs');


const AWS_REGIONS = {
    "us-east-1": "dynamodb.us-east-1.amazonaws.com",
    "us-west-1": "dynamodb.us-west-1.amazonaws.com",
    "ap-southeast-1": "dynamodb.ap-southeast-1.amazonaws.com",
    "us-west-2": "dynamodb.us-west-2.amazonaws.com",
    "sa-east-1": "dynamodb.sa-east-1.amazonaws.com",
    "eu-central-1": "dynamodb.eu-central-1.amazonaws.com",
    "eu-west-1": "dynamodb.eu-west-1.amazonaws.com",
    "ap-northeast-1": "dynamodb.ap-northeast-1.amazonaws.com",
    "ap-southeast-2": "dynamodb.ap-southeast-2.amazonaws.com",
    "us-east-2": "dynamodb.us-east-2.amazonaws.com",
    "af-south-1": "dynamodb.af-south-1.amazonaws.com",
    "ap-east-1": "dynamodb.ap-east-1.amazonaws.com",
    "ca-central-1": "dynamodb.ca-central-1.amazonaws.com",
    "eu-west-2": "dynamodb.eu-west-2.amazonaws.com",
    "eu-south-1": "dynamodb.eu-south-1.amazonaws.com",
    "eu-west-3": "dynamodb.eu-west-3.amazonaws.com",
    "eu-north-1": "dynamodb.eu-north-1.amazonaws.com",
    "ap-south-1": "dynamodb.ap-south-1.amazonaws.com",
    "ap-northeast-2": "dynamodb.ap-northeast-2.amazonaws.com",
};
const regionsMap = {
    "us-east-1": "US East (N. Virginia)",
    "us-east-2": "US East (Ohio)",
    "us-west-1": "US West (N. California)",
    "us-west-2": "US West (Oregon)",
    "af-south-1": "Africa (Cape Town)",
    "ap-south-1": "Asia Pacific (Mumbai)",
    "ap-northeast-2": "Asia Pacific (Seoul)",
    "ap-southeast-1": "Asia Pacific (Singapore)",
    "ap-southeast-2": "Asia Pacific (Sydney)",
    "ap-northeast-1": "Asia Pacific (Tokyo)",
    "ca-central-1": "Canada (Central)",
    "eu-central-1": "Europe (Frankfurt)",
    "eu-west-1": "Europe (Ireland)",
    "eu-west-2": "Europe (London)",
    "eu-south-1": "Europe (Milan)",
    "eu-west-3": "Europe (Paris)",
    "eu-north-1": "Europe (Stockholm)",
    "sa-east-1": "South America (São Paulo)",
};
const TOTAL_PINGS = 15;
const TOTAL_REGIONS = 18;

const getRegionFlags = (regionCode) => {
    switch (regionCode) {
        case "us-east-1":
        case "us-east-2":
        case "us-west-1":
        case "us-west-2":
            return "united-states";
        case "af-south-1":
            return "south-africa";
        case "ap-south-1":
            return "india";
        case "ap-northeast-2":
            return "south-korea";
        case "ap-southeast-1":
            return "singapore";
        case "ap-southeast-2":
            return "australia";
        case "ap-northeast-1":
            return "japan";
        case "ca-central-1":
            return "canada";
        case "eu-central-1":
            return "germany";
        case "eu-west-1":
            return "ireland";
        case "eu-west-2":
            return "united-kingdom";
        case "eu-south-1":
            return "italy";
        case "eu-west-3":
            return "france";
        case "eu-north-1":
            return "sweden";
        case "sa-east-1":
            return "brazil";
        default:
            return "";
    }
}

const getLatencyStyle = (time) => {
    if (!time || time > 250)
        return 'red';
    else if (time >= 100 && time <= 250)
        return 'orange';
}

const checkAvgLatency = (list) => {
    return Math.round(list.reduce((sum, num) => sum + (num ? num : 0), 0) / list.length);
}

const calculateProgress = (pingCount) => {
    return pingCount * (100 / TOTAL_PINGS)
}

const calculateOffset = (pingCount) => {
    const progress = calculateProgress(pingCount);
    const strokeWidth = 6;
    const radius = (100 / 2) - (strokeWidth * 2);
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - progress / 100 * circumference;

    return offset;
}

const PingComponent = () => {
    const [pingResults, setPingResults] = useState();
    const [isReady, setIsReady] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [recommendedRegion, setRecommendedRegion] = useState();
    const [pingCount, setPingCount] = useState();
    const [isSorted, setIsSorted] = useState(false);

    const initPingRegions = () => {
        const regions = Object.entries(regionsMap);
        const awsPingMap = regions.map(region => ({
            codename: region[0],
            name: region[1],
            url: 'https://' + AWS_REGIONS[region[0]] + '/ping',
            pings: [],
            latency: ''
        }))
        setPingResults(awsPingMap);
    }

    const addPingResult = (index, time) => {
        const newPingResults = [...pingResults];
        const newRegionMap = newPingResults[index];
        newRegionMap.pings.push(time);
        newRegionMap.latency = time ? checkAvgLatency(newRegionMap.pings) : newRegionMap.latency;
        setPingResults(newPingResults);
    }

    const checkLatency = (index) => {
        const { url } = pingResults[index];
        if (url)
            return ping(url).then(function (delta) {
                console.log('Ping time was ' + String(delta) + 'ms => ' + url);
                addPingResult(index, delta);
            }).catch(function (err) {
                console.error('Could not ping remote URL =>', url, err);
                addPingResult(index, '');
            });
        else
            addPingResult(index, null);
    }

    const cloudPingTest = async () => {
        const pingRequests = pingResults.map((region, index) => checkLatency(index));
        return await Promise.allSettled(pingRequests);
    }

    const startPinging = async () => {
        console.log('Ping test =>', pingCount + 1)
        await cloudPingTest();
        setPingCount(pingCount + 1);
    }

    const resetTest = () => {
        setIsReady(false);
        setPingCount(0);
        setIsSorted(false);
    }

    const startPingTest = () => {
        resetTest();
        setIsFinished(false);
        setRecommendedRegion();
        initPingRegions();
    }

    useEffect(() => {
        startPingTest();
    }, [])

    useEffect(() => {
        if (pingResults?.length === TOTAL_REGIONS)
            setIsReady(true);
        if (pingResults?.every(region => region.pings.length === TOTAL_PINGS))
            setIsFinished(true);
    }, [pingResults])

    useEffect(() => {
        if (isReady && pingCount != TOTAL_PINGS)
            startPinging();
    }, [isReady, pingCount])

    const calculateRecommendRegion = () => {
        const latencies = pingResults.map(region => region.latency).filter(latency => latency);
        const minLatency = Math.min(...latencies);
        const minLatencyIndex = pingResults.findIndex(region => region.latency == minLatency);
        setRecommendedRegion(minLatencyIndex);
        return minLatencyIndex;
    }

    const sortRegions = () => {
        const regions = [...pingResults];
        const sortedRegions = regions.sort((a, b) => a.latency - b.latency);

        // setPingResults(sortedRegions);
        setIsSorted(true);
    }

    useEffect(() => {
        if (isFinished) {
            console.log('Ping result =>', pingResults);
            sortRegions();
            setTimeout(resetTest, 100);
        }
    }, [isFinished])

    useEffect(() => {
        if (isSorted)
            calculateRecommendRegion();
    }, [isSorted])

    return (
        <div className="global_wrapper">
            <a src="/" className="logo" title="Toktown">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 306.8 70.8">
                    <circle cx="30.9" cy="34.2" r="3.8" fill="#FF0201"></circle>
                    <circle cx="41.9" cy="34.2" r="3.8"></circle>
                    <circle cx="19.8" cy="34.2" r="3.8"></circle>
                    <path d="M30.9 8.8c-14 0-25.4 11.4-25.4 25.4s11.4 25.4 25.4 25.4 25.4-11.4 25.4-25.4S44.9 8.8 30.9 8.8zm0 45.1c-10.9 0-19.7-8.8-19.7-19.7S20 14.5 30.9 14.5s19.7 8.8 19.7 19.7-8.8 19.7-19.7 19.7zm50.9-32.7v32.4H74V21.2H61.5v-7.3h32.9v7.3H81.8zm38.9 18.5c0 8.5-6.2 14.6-14.4 14.6s-14.4-6.2-14.4-14.6c0-8.5 6.2-14.6 14.4-14.6s14.4 6.1 14.4 14.6zm-7.4 0c0-5.2-3.4-7.8-7-7.8s-7 2.6-7 7.8 3.4 7.8 7 7.8 7-2.5 7-7.8zm29-2.1l11.3 16h-9.1L137.1 43l-3.1 3.2v7.3h-7.4V13h7.4v23.2l9.5-10.2h9.7l-10.9 11.6zm32.9-16.4v32.4h-7.8V21.2h-12.5v-7.3h32.9v7.3h-12.6zm38.9 18.5c0 8.5-6.2 14.6-14.4 14.6s-14.4-6.2-14.4-14.6c0-8.5 6.2-14.6 14.4-14.6s14.4 6.1 14.4 14.6zm-7.5 0c0-5.2-3.4-7.8-7-7.8s-7 2.6-7 7.8 3.4 7.8 7 7.8c3.7.1 7-2.5 7-7.8zM242.7 26l5.9 17.8 5.1-17.8h7.4l-8.6 27.6H245l-6.4-18.8-6.3 18.8h-7.6L215.9 26h7.8l5.1 17.7 6-17.7h7.9zm30.5 27.5h-7.4V26h7.2v3.4c1.7-2.9 5-4.1 8-4.1 6.8 0 10 4.9 10 10.9v17.4h-7.4V37.5c0-3.1-1.5-5.5-5.1-5.5-3.2 0-5.2 2.5-5.2 5.7v15.8z"></path>
                </svg>
            </a>
            <div className="container">
                <div className="top_bg_image"></div>
                <div className="region-test">
                    <div className="d-flex">
                        <div className="element">
                            <h4 className="header-title">
                                AWS Media Region Test
                            </h4>
                            <p>
                                Test performance of various AWS media regions across the world.
                                Lower latency is better for video calls.
                                Best regions are sorted on the top with our recommended region.
                            </p>
                        </div>
                        {/* play button */}
                        <div className="element">
                            <div className="refresh-icon" onClick={() => isFinished && startPingTest()}>
                                <div className={`switch demo1 ${(isReady) ? "active" : ""}`}>
                                    <div className={`c-speedtest-lodig`} id="speedProgress" style={{ strokeDashoffset: calculateOffset(pingCount) }}>
                                        {/* <div className={`c-speedtest-lodig loding-${pingCount * (100 / TOTAL_PINGS)}`} id="speedProgress"> */}
                                        <svg viewBox="0 0 100 100"><path d="M 50,50 m 0,-47 a 47,47 0 1 1 0,94 a 47,47 0 1 1 0,-94" stroke="#eee" stroke-width="1" fill-opacity="0"></path><path d="M 50,50 m 0,-47 a 47,47 0 1 1 0,94 a 47,47 0 1 1 0,-94" stroke="#0DBE42" stroke-width="6" fill-opacity="0"></path>
                                        </svg>
                                    </div>
                                    <label></label>
                                    <span className="c-speedtest-play">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 163.861 163.861"><path d="M34.857 3.613C20.084-4.861 8.107 2.081 8.107 19.106v125.637c0 17.042 11.977 23.975 26.75 15.509L144.67 97.275c14.778-8.477 14.778-22.211 0-30.686L34.857 3.613z"></path>
                                        </svg>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row m-t-20">
                        {pingResults?.map((region, index) => (
                            <div className="col-md-4" key={nanoid()}>
                                <div
                                    className={`green-border ${recommendedRegion === index ? "" : "gray-border"
                                        }`}
                                >
                                    <span className="number">{index + 1}</span>
                                    {recommendedRegion === index && (
                                        <div className="recomend">
                                            <img src="images/recommended.svg" />
                                        </div>
                                    )}
                                    <div className="region-sec">
                                        <div className="region-img">
                                            <img
                                                src={`images/flags/${getRegionFlags(
                                                    region.codename
                                                )}.png`}
                                                alt=""
                                            />
                                        </div>
                                        <div className="region-name">{region.name}</div>
                                    </div>
                                    {/* progress bar */}
                                    <div className="loader_wrapper">
                                        {isReady && !isFinished && (
                                            <div className="progress">
                                                <span
                                                    className="progress-bar"
                                                    style={{
                                                        width: `${calculateProgress(region.pings.length)}%`,
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="latency">
                                        Latency(in ms)
                                        <span className={getLatencyStyle(region.latency)}>
                                            {region.latency || <span className='latency-unavailable red'>Unreachable</span>}
                                        </span>
                                    </div>
                                    <span className="count-no">{region.pings.length}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PingComponent