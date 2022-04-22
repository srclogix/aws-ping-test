import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';
import './Ping.css';
const ping = require('web-pingjs');

// Define the regions to check.
const AWS_REGIONS = {
    "us-east-1": "ec2.us-east-1.amazonaws.com",
    "us-west-1": "ec2.us-west-1.amazonaws.com",
    "ap-southeast-1": "ec2.ap-southeast-1.amazonaws.com",
    "us-west-2": "ec2.us-west-2.amazonaws.com",
    "sa-east-1": "ec2.sa-east-1.amazonaws.com",
    "eu-central-1": "ec2.eu-central-1.amazonaws.com",
    "eu-west-1": "ec2.eu-west-1.amazonaws.com",
    "ap-northeast-1": "ec2.ap-northeast-1.amazonaws.com",
    "ap-southeast-2": "ec2.ap-southeast-2.amazonaws.com",
    "us-east-2": "ec2.us-east-2.amazonaws.com",
    "af-south-1": "ec2.af-south-1.amazonaws.com",
    "ap-east-1": "ec2.ap-east-1.amazonaws.com",
    "ca-central-1": "ec2.ca-central-1.amazonaws.com",
    "eu-west-2": "ec2.eu-west-2.amazonaws.com",
    "eu-south-1": "ec2.eu-south-1.amazonaws.com",
    "eu-west-3": "ec2.eu-west-3.amazonaws.com",
    "eu-north-1": "ec2.eu-north-1.amazonaws.com",
    "ap-south-1": "ec2.ap-south-1.amazonaws.com",
    "ap-northeast-2": "ec2.ap-northeast-2.amazonaws.com"
};
const regionsMap = {
    "us-east-1": "US East (N. Virginia) (us-east-1)",
    "us-east-2": "US East (Ohio) (us-east-2)",
    "us-west-1": "US West (N. California) (us-west-1)",
    "us-west-2": "US West (Oregon) (us-west-2)",
    "af-south-1": "Africa (Cape Town) (af-south-1)",
    "ap-south-1": "Asia Pacific (Mumbai) (ap-south-1)",
    "ap-northeast-2": "Asia Pacific (Seoul) (ap-northeast-2)",
    "ap-southeast-1": "Asia Pacific (Singapore) (ap-southeast-1)",
    "ap-southeast-2": "Asia Pacific (Sydney) (ap-southeast-2)",
    "ap-northeast-1": "Asia Pacific (Tokyo) (ap-northeast-1)",
    "ca-central-1": "Canada (Central) (ca-central-1)",
    "eu-central-1": "Europe (Frankfurt) (eu-central-1)",
    "eu-west-1": "Europe (Ireland) (eu-west-1)",
    "eu-west-2": "Europe (London) (eu-west-2)",
    "eu-south-1": "Europe (Milan) (eu-south-1)",
    "eu-west-3": "Europe (Paris) (eu-west-3)",
    "eu-north-1": "Europe (Stockholm) (eu-north-1)",
    "sa-east-1": "South America (São Paulo) (sa-east-1)"
};
const TOTAL_PINGS = 10;
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
    switch (time) {
        case time > 700:
            return 'red';
        case time >= 500 && time <= 700:
            return 'orange';
        default:
            return '';
    }
}

const checkAvgLatency = (list) => {
    return Math.round(list.reduce((sum, num) => sum + num, 0) / list.length);
}

const Ping = () => {
    const [pingResults, setPingResults] = useState();
    const [isReady, setIsReady] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [recommendedRegion, setRecommendedRegion] = useState();

    const initPingRegions = () => {
        const regions = Object.entries(regionsMap);

        const awsPingMap = regions.map(region => ({
            codename: region[0],
            name: region[1],
            url: AWS_REGIONS[region[0]],
            pings: [],
            latency: ''
        }))

        setPingResults(awsPingMap);
    }

    const addPingResult = (index, time) => {
        const newPingResults = [...pingResults];
        const newRegionMap = newPingResults[index];

        newRegionMap.pings.push(time);
        newRegionMap.latency = time && checkAvgLatency(newRegionMap.pings);

        setPingResults(newPingResults);
    }

    const checkLatency = (index) => {
        const { url } = pingResults[index];

        if (url)
            return ping(url).then(function (delta) {
                console.log('Ping time was ' + String(delta) + 'ms => ' + url);
                addPingResult(index, delta);
            }).catch(function (err) {
                console.error('Could not ping remote URL', err);
            });
        else
            addPingResult(index, null);
    }

    const cloudPingTest = async () => {
        const pingRequests = pingResults.map((region, index) => checkLatency(index));

        return await Promise.all(pingRequests);
    }

    const startPinging = async (times) => {
        for (let i = 0; i < times; i++) {
            console.log('Ping test =>', i + 1)
            await cloudPingTest();
        }
    }

    const startPingTest = () => {
        setIsReady(false);
        setIsFinished(false);
        setRecommendedRegion();
        initPingRegions();
    }

    useEffect(() => {
        startPingTest();
    }, [])

    useEffect(() => {
        console.log('aanni', pingResults);

        if (pingResults?.length === TOTAL_REGIONS)
            setIsReady(true);
        if (pingResults?.every(region => region.pings.length === TOTAL_PINGS))
            setIsFinished(true);
    }, [pingResults])

    useEffect(() => {
        if (isReady)
            startPinging(TOTAL_PINGS);
    }, [isReady])

    const calculateRecommendRegion = () => {
        const latencies = pingResults.map(region => region.latency).filter(latency => latency);
        const minLatency = Math.min(...latencies);
        const minLatencyIndex = pingResults.findIndex(region => region.latency == minLatency);

        setRecommendedRegion(minLatencyIndex);

        return minLatencyIndex;
    }

    useEffect(() => {
        if (isFinished)
            calculateRecommendRegion();
    }, [isFinished])

    return (
        <div className='container'>
            <div className='region-test'>
                <div className='d-flex'>
                    <h4 className='header-title'>Media Region Test
                        <p>Latency ping test tool. Tests across various AWS Media Regions across the globe. Help user pick the most optimal media region.</p>
                    </h4>
                    {
                        isFinished &&
                        <div className='refresh-icon' onClick={startPingTest}>
                            <img src='images/restore.svg' />
                            <span className='tooltiptext'>Refresh</span>
                        </div>
                    }
                </div>
                <div className='row m-t-20'>
                    {
                        pingResults?.map((region, index) =>
                            <div className='col-md-4' key={nanoid()}>
                                <div className={`green-border ${recommendedRegion === index ? "" : "gray-border"}`}>
                                    <span className='number'>
                                        {index + 1}
                                    </span>
                                    {
                                        recommendedRegion === index &&
                                        <div className='recomend'>
                                            <img src='images/recommended.svg' />
                                        </div>
                                    }
                                    <div className='region-sec'>
                                        <div className='region-img'>
                                            <img src={`images/flags/${getRegionFlags(region.codename)}.png`} alt='' />
                                        </div>
                                        <div className='region-name'>
                                            {region.name}
                                        </div>
                                    </div>
                                    <div className="progress">
                                        <span className="progress-bar" style={{ width: `${region.pings.length * TOTAL_PINGS}%` }} />
                                    </div>
                                    <div className='latency'>
                                        Latency(in ms)
                                        <span className={getLatencyStyle(region.latency)}>
                                            {region.latency || 'NAN'}
                                        </span>
                                    </div>
                                    <span className='count-no'>{region.pings.length}</span>
                                </div>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    )
}

export default Ping