import * as vscode from 'vscode'

export default class YoutubeProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'youtube.start'
  private _view?: vscode.WebviewView

  public static MODE = {
    LIST: 'list',
    GRID: 'grid',
    COMPACT: 'compact'
  }

  public static MASKMODE = {
    SHOW: 'show',
    CONTROLS: 'controls',
    HIDDEN: 'hidden'
  }

  constructor (
    private readonly _extensionUri: vscode.Uri
  ) { }

  public resolveWebviewView (
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'media')
      ]
    }

    webviewView.webview.html = this.getWebviewContent(webviewView.webview)

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'search': {
          if (message.query === false) {
            await vscode.window.showWarningMessage('Please enter search query. Minimum 3 character to search')
          } else {
            await vscode.commands.executeCommand('youtube.search', {
              query: message.query
            })
          }
          break
        }
        case 'playmode': {
          vscode.commands.executeCommand('setContext', 'player-state', message.state)
          break
        }
        case 'mutemode': {
          vscode.commands.executeCommand('setContext', 'player-audio', message.state)
          break
        }
        case 'player-section': {
          vscode.commands.executeCommand('setContext', 'player-section', message.state)
          break
        }
      }
    })
  }

  private getWebviewContent (webview: vscode.Webview): string {
    const nonce = this.getNonce()
    const scriptLibPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'mithril.js')
    const scriptLibUri = webview.asWebviewUri(scriptLibPathOnDisk)
    const scriptPlayerPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'player.js')
    const scriptPlayerUri = webview.asWebviewUri(scriptPlayerPathOnDisk)
    const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk)
    const stylesPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css')
    const styleMainUri = webview.asWebviewUri(stylesPathOnDisk)

    return `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <!--meta http-equiv="Content-Security-Policy" content="style-src ${webview.cspSource}; script-src 'nonce-${nonce}';"-->
          <title>Youtube</title>
          <link href="${styleMainUri.toString()}" rel="stylesheet">
        </head>
        <body>
          <main class="wrap">
            <div id="search" class="search"></div>
            <div id="container" class="container"></div>
          </main>
          <script nonce="${nonce}" src="${scriptLibUri.toString()}"></script>
          <script nonce="${nonce}" src="${scriptPlayerUri.toString()}"></script>
          <script nonce="${nonce}" src="${scriptUri.toString()}"></script>
        </body>
      </html>`
  }

  private getNonce (): string {
    let text = ''
    // eslint-disable-next-line max-len
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
  }

  public list (videos: any): void {
    this._view?.webview.postMessage({
      command: 'list',
      videos
    })
  }

  public search (query: string): void {
    this._view?.webview.postMessage({
      command: 'search',
      query
    })
  }

  public layout(mode: string): void {
    this._view?.webview.postMessage({
      command: 'layout',
      mode
    })
  }

  public mask(hidden: boolean): void {
    this._view?.webview.postMessage({
      command: 'mask',
      hidden
    })
  }

  public control(mode: string, state: boolean): void {
    this._view?.webview.postMessage({
      command: mode,
      state
    })
  }
}
