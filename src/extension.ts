import * as vscode from 'vscode';
import { exec } from 'child_process';

//creates a dedicated output channel for ETCA: used for logging the execution process, 
// including any errors or warnings from the assembler and the output from the simulator. 
// This allows users to see all relevant information in one place without cluttering the terminal or other output channels.
let etcaOutputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
    //initializes the output channel
    etcaOutputChannel = vscode.window.createOutputChannel('ETCA execution');
    
    let runCommand = vscode.commands.registerCommand('etca.runProgram', async () => {
        const editor = vscode.window.activeTextEditor;
        
        if (!editor) {
            vscode.window.showErrorMessage('No active ETCA file to run.');
            return;
        }

        const document = editor.document;

        // auto-save  file before running
        if (document.isDirty) {
            await document.save();
        }

        const filePath = document.uri.fsPath;
        
        // TODO: Replace 'etca-cli' with your actual assembler/simulator command.
        // For production, you might want to read this path from VS Code workspace settings.
        const command = `etca-cli run "${filePath}"`;

        // Focus the output channel and clear previous runs
        etcaOutputChannel.show(true);
        etcaOutputChannel.clear();
        etcaOutputChannel.appendLine(`[Running] ${command}\n`);

        // Execute the CLI tool
        exec(command, (error, stdout, stderr) => {
            if (error) {
                etcaOutputChannel.appendLine(`[Process Error] Execution failed: ${error.message}`);
                // If the assembler throws a non-zero exit code, the errors usually live in stderr
                if (stderr) {
                    etcaOutputChannel.appendLine(`[Assembler Diagnostics]:\n${stderr}`);
                }
                return;
            }

            // Print standard warnings/errors
            if (stderr) {
                etcaOutputChannel.appendLine(`[Warnings/Errors]:\n${stderr}`);
            }

            // Print standard output (the simulator result)
            etcaOutputChannel.appendLine(`[Output]:\n${stdout}`);
            etcaOutputChannel.appendLine(`\n[Finished]`);
        });
    });

    // Register disposables so VS Code cleans them up when the extension is deactivated
    context.subscriptions.push(runCommand);
    context.subscriptions.push(etcaOutputChannel);
}

export function deactivate() {
    // Optional clean up
    if (etcaOutputChannel) {
        etcaOutputChannel.dispose();
    }
}