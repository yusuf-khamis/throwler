# wow-logger

Node.JS simplistic logger that auto rotates logs

Wow logger was designed with the intention of making it extremely easy to log content from a NodeJS app with the feature of auto rotating files.

## Why wow logger

1. Its extremely light
2. Minimal configurations
3. Gets work done
4. Easy to get started

## Installation

``` sh
$ npm install wow-logger
```

## Options

* **output:** Specifies where to put the logs. Accepts `console` and `file` to either output to console or file respectively. Default is `file`.
* **levels:** Specifies the levels array in which to classify the logs in, these are not restricted to any values but only alpha characters allowed. Default is `[]`.
* **timestamp:** Whether or not to include timestamp in the logs. Default is `true`;
* **autorotate:** Specifies the frequency in which to rotate logs. Accepts `hourly`, `daily`, `none`. If `none` is specified, no logs will still be saved in the display name date format but will not be folderised. Default is `hourly`.
* **dirDateFormat** This sets the  date format for which to be used to name the folders when rotating logs. Accepts same formatting options as moment but only for date, month and year (DMY) and separators (-_., \/). Default is `DD-MMMM-YYYY`.
* **dateFormat** This sets the date format for naming the log files. Accepts same formatting options as moment. All log files have extension `.log`. When level specified e.g. _error_, log file will be _12-December-2018_error.log_ or _12-December-2018.log_ if level not specified. Default is `DD-MMMM-YYYYTHH`.
* **dir** This sets the location in which to store the logs (files or folders). Default is `.`.

## Usage

``` js

const logger = require('wow-logger');
const path = require('path');

const log = logger({
    output: 'file',
    levels: [
        'error',
        'warning',
        'info'
    ],
    timestamp: true,
    autorotate: 'hourly',
    dirDateFormat: 'DD-MMMM-YYYY',
    dateFormat: 'DD-MMMM-YYYYTHH',
    dir: path.resolve(__dirname, 'logs')
});

log('Hello wow logger with level', 'info'); //NB: If this level is not specified in levels option then it will be discarded

log('Hello wow logger without level');

```

## LICENCE

**MIT**