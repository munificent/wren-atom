'use babel';

const BufferedProcess = require('atom').BufferedProcess;

module.exports = {
  config: {
    wrenPath: {
      title: 'The path to the "wren" executable used to run wrenalyzer.',
      type: 'string',
      default: 'wren',
    },
    wrenalyzerPath: {
      title: 'The path to "wrenalyzer.wren".',
      type: 'string',
      default: ''
    }
  },
  provideLinter() {
    return {
      name: 'Wren',
      grammarScopes: ['source.wren'],
      scope: 'file',
      // TODO: Make this true when wrenalyzer doesn't read the file from disc.
      lintOnFly: false,
      lint(textEditor) {
        return new Promise((resolve, reject) => {
          runLinter(textEditor, resolve);
        });
      }
    };
  }
};

function runLinter(textEditor, resolve) {
  var command = atom.config.get('language-wren.wrenPath');
  var args = [
    atom.config.get('language-wren.wrenalyzerPath'),
    '--json',
    textEditor.getPath()
  ];

  console.log('Running ' + command + ' ' + args.join(' '));

  var lints = [];
  const process = new BufferedProcess({
    command: command,
    args: args,
    // options: options,
    stdout(data) {
      const lines = data.split('\n');

      for (var line of lines) {
        if (line.trim() == '') continue;

        try {
          const obj = JSON.parse(line);
          // TODO: Report traces for other tokens.
          const token = obj.tokens[obj.tokens.length - 1];

          lints.push({
            type: 'Error', // TODO: Use severity.
            text: obj.message,
            range:[
              [token.lineStart - 1, token.columnStart - 1],
              [token.lineEnd - 1, token.columnEnd - 1]
            ],
            filePath: textEditor.getPath()
          });
        } catch (error) {
          // TODO: Report error here.
          console.log("Could not parse JSON: " + line);
        }
      }
    },
    stderr(data) {
      console.log("stderr: " + data);
      // stderrLines.push(data);
    },
    exit(code) {
      // TODO: Handle exit code.
      resolve(lints);
    }
  });
  
  process.onWillThrowError(function({error, handle}) {
    console.log("error " + error);
    // atom.notifications.addError("Failed to run " + executablePath, {
    //   detail: error.message
    // });
    handle();
    return resolve([]);
  });
}
