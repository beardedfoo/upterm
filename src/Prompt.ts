import events = require('events');
import Autocompletion = require('./Autocompletion');
import Buffer = require('./Buffer');
import Aliases = require('./Aliases');
import History = require('./History');
import _ = require('lodash');

class Prompt extends events.EventEmitter {
    private buffer: Buffer;
    private autocompletion = new Autocompletion();
    history: any;

    constructor(private directory: string) {
        super();

        this.buffer = new Buffer();
        this.buffer.on('data', () => {
            this.emit('data');
        });

        this.history = History;
    }

    send(value: string): void {
        this.buffer.setTo(value);
        this.history.append(value);
        this.emit('send');
    }

    getCommandName(): string {
        return this.expandCommand(this.buffer.toString())[0];

    }

    getArguments(): string[] {
        return this.getCommand().slice(1);
    }

    getCommand(): Array<string> {
        return this.expandCommand(this.buffer.toString())
    }

    getSuggestions(callback: (suggestions: string[]) => void) {
        this.autocompletion.getSuggestions(this.directory, this.buffer.toString(), (suggestions) => {
            callback(_.uniq(suggestions).slice(0, 50));
        });
    }

    private expandCommand(command: string): Array<string> {
        // Split by comma, but not inside quotes.
        // http://stackoverflow.com/questions/16261635/javascript-split-string-by-space-but-ignore-space-in-quotes-notice-not-to-spli
        var parts = <string[]>command.match(/(?:[^\s']+|'[^']*')+/g);

        if (!parts) {
            return [];
        }
        var commandName = parts.shift();

        var alias: string = Aliases.find(commandName);

        if (alias) {
            parts = this.expandCommand(alias).concat(parts);
        } else {
            parts.unshift(commandName);
        }

        return parts;
    }
}

export = Prompt;
