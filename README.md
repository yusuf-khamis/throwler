# throwler

Node.JS simplistic logger that auto rotates logs

Throwler was designed with the intention of making it extremely easy to log content from a NodeJS app with the feature of auto rotating files.

*I made this library because I wanted to have the logging feature on my app and I felt like none of the libraries did it how I wanted.*

## Why throwler

1. Its extremely light
2. Minimal configurations
3. Gets work done
4. Easy to get started

## Installation

``` sh
$ npm install throwler
```

## Options

* **output:** Specifies where to put the logs. Accepts `console` and `file` to either output to console or file respectively. Default is `file`.
* **timestamp:** Whether or not to include timestamp in the logs. Default is `true`;
* **autorotate:** Specifies the frequency in which to rotate logs. Accepts `hourly`, `daily`, `none`. If `none` is specified, no logs will still be saved in the display name date format but will not be folderised. Default is `hourly`.
* **dirDateFormat** This sets the  date format for which to be used to name the folders when rotating logs. Accepts same formatting options as moment but only for date, month and year (DMY) and separators (-_., \/). Default is `DD-MMMM-YYYY`.
* **dateFormat** This sets the date format for naming the log files. Accepts same formatting options as moment. All log files have extension `.log`. When level specified e.g. _error_, log file will be _12-December-2018_error.log_ or _12-December-2018.log_ if level not specified. Default is `DD-MMMM-YYYYTHH`.
* **dir** This sets the location in which to store the logs (files or folders). Default is `.`.
* **size** This the size limit for each file after which another file will be created on logging. Values can be in gigabytes (`G`), megabytes (`M`) or kilobytes (`K`). The units are case insensitive. Default is `10M`

## Usage

``` js

const logger = require('throwler');
const path = require('path');

const log = logger({
    output: 'file',
    timestamp: true,
    autorotate: 'hourly',
    dirDateFormat: 'DD-MMMM-YYYY',
    dateFormat: 'DD-MMMM-YYYYTHH',
    dir: path.resolve(__dirname, 'logs'),
    size: '10M'
});

log('Hello throwler with level', 'info'); //NB: This level will just classify the logs into their separate intended content

log('Hello throwler without level'); // NB: All logs in one autorotated file file

```

## LICENCE

**MIT**
