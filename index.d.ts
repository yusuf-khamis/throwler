declare module 'throwler' {

    /**
     * LogMethod
     *
     * Method that outputs the logs
     *
     * @param content Content to be logged
     * @param level The level in which to log the content in
     */
    interface LogMethod {
        (content: any, level?: string): void;
    }

    /**
     * LoggerOptions
     *
     * Configurations for logging module
     */
    interface LoggerOptions {
        output?: 'console' | 'file';
        timestamp?: boolean;
        autorotate?: 'hourly' | 'daily' | 'none';
        dateFormat?: string;
        dirDateFormat?: string;
        dir?: string;
        size?: string;
    }

    /**
     * createLogger
     *
     * Method that gets called with/out the options to create a logger that will be called to log content
     *
     * @param options Options that will be used to configure the logging module
     *
     * @return function Function that will be called to log actual content
     */
    function createLogger(options?: LoggerOptions): LogMethod;

}
