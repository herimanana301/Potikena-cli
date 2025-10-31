#!/usr/bin/env node
import {Command} from "commander"
import {welcome, mediaChoice} from "./engine/handlers.js"

require('ts-node').register({
  transpileOnly: false,
  compilerOptions: {
    module: 'commonjs',
    allowJs: true,
    checkJs: false,     
    esModuleInterop: true
  }
});

const program = new Command()

program
  .description('Displayed when only potikena is entered')
  .action(async () => {
    await welcome()
    await mediaChoice()
  });
//Other commands for shortcuts will come
  program.parse(process.argv);
