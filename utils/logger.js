const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logLevels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
        
        this.currentLevel = process.env.LOG_LEVEL || 'info';
        this.enableFileLogging = process.env.ENABLE_FILE_LOGGING === 'true';
        
        // Create logs directory if file logging is enabled
        if (this.enableFileLogging) {
            const logsDir = path.join(__dirname, '../logs');
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }
        }
    }

    formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ') : '';
        
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
    }

    shouldLog(level) {
        return this.logLevels[level] <= this.logLevels[this.currentLevel];
    }

    writeToFile(message) {
        if (!this.enableFileLogging) return;
        
        const today = new Date().toISOString().split('T')[0];
        const logFile = path.join(__dirname, '../logs', `${today}.log`);
        
        fs.appendFileSync(logFile, message + '\n');
    }

    log(level, message, ...args) {
        if (!this.shouldLog(level)) return;
        
        const formattedMessage = this.formatMessage(level, message, ...args);
        
        // Console output with colors
        const colors = {
            error: '\x1b[31m', // Red
            warn: '\x1b[33m',  // Yellow
            info: '\x1b[36m',  // Cyan
            debug: '\x1b[35m'  // Magenta
        };
        
        const resetColor = '\x1b[0m';
        console.log(colors[level] + formattedMessage + resetColor);
        
        // File output
        this.writeToFile(formattedMessage);
    }

    error(message, ...args) {
        this.log('error', message, ...args);
    }

    warn(message, ...args) {
        this.log('warn', message, ...args);
    }

    info(message, ...args) {
        this.log('info', message, ...args);
    }

    debug(message, ...args) {
        this.log('debug', message, ...args);
    }
}

module.exports = new Logger();
