import * as vscode from 'vscode'
import YoutubeProvider from './YoutubeProvider'
import * as yts from 'yt-search'

export function activate(context: vscode.ExtensionContext) {
  const provider = new YoutubeProvider(context.extensionUri)

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(YoutubeProvider.viewType, provider)
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('youtube.player.play', async () => {
      await vscode.commands.executeCommand('setContext', 'player-state', true)
      provider.control('play', true)
    }),
    vscode.commands.registerCommand('youtube.player.pause', async () => {
      await vscode.commands.executeCommand('setContext', 'player-state', false)
      provider.control('play', false)
    }),
    vscode.commands.registerCommand('youtube.player.mute', async () => {
      await vscode.commands.executeCommand('setContext', 'player-audio', true)
      provider.control('mute', true)
    }),
    vscode.commands.registerCommand('youtube.player.unmute', async () => {
      await vscode.commands.executeCommand('setContext', 'player-audio', false)
      provider.control('mute', false)
    }),
    vscode.commands.registerCommand('youtube.player.mask', async () => {
      await vscode.commands.executeCommand('setContext', 'player-masked', true)
      await vscode.workspace.getConfiguration().update(
        'youtube.maskmode',
        true,
        vscode.ConfigurationTarget.Global
      )
      provider.mask(true)
    }),
    vscode.commands.registerCommand('youtube.player.unmask', async () => {
      await vscode.commands.executeCommand('setContext', 'player-masked', false)
      await vscode.workspace.getConfiguration().update(
        'youtube.maskmode',
        false,
        vscode.ConfigurationTarget.Global
      )
      provider.mask(false)
    }),
    vscode.commands.registerCommand('youtube.openbrowser', (data) => {
      vscode.commands.executeCommand('vscode.open', data.video)
    }),
    vscode.commands.registerCommand('youtube.search', async (payload) => {
      let message = null
      if (!payload) {
        const result = await vscode.window.showInputBox({
          placeHolder: 'Search video ...',
          validateInput: query => {
            return query !== null
                && query.trim() !== ''
                && query.trim().length > 2 ? null : query
          }
        })
        if (result) {
          message = result
          provider.search(result)
        }
      } else {
        message = payload.query
      }
      const results = await yts.search(message)
      const videos = results.videos
      provider.list(videos)
    }),
    vscode.commands.registerCommand('youtube.layout', async () => {
      const layout = vscode.workspace.getConfiguration().get('youtube.resultmode')
      const quickPick = vscode.window.createQuickPick()
      quickPick.title = 'View mode'
      quickPick.items = [
        {
          label: YoutubeProvider.MODE.LIST,
          picked: layout === YoutubeProvider.MODE.LIST,
          description: 'List mode',
          iconPath: new vscode.ThemeIcon('list-selection')
        },
        {
          label: YoutubeProvider.MODE.GRID,
          picked: layout === YoutubeProvider.MODE.GRID,
          description: 'Grid mode',
          iconPath: new vscode.ThemeIcon('gripper')
        },
        {
          label: YoutubeProvider.MODE.COMPACT,
          picked: layout === YoutubeProvider.MODE.COMPACT,
          description: 'Compact mode',
          iconPath: new vscode.ThemeIcon('list-unordered')
        }
      ]
      quickPick.onDidChangeSelection(async (selection) => {
        if (selection.length > 0 && layout !== selection[0].label) {
          void vscode.workspace.getConfiguration().update(
            'youtube.resultmode',
            selection[0].label,
            vscode.ConfigurationTarget.Global
          ).then(async () => {
            provider.layout(selection[0].label)
          })
        }
        quickPick.hide()
        return true
      })
      quickPick.onDidHide(() => quickPick.dispose)
      quickPick.show()
    })
  )

  const config = vscode.workspace.getConfiguration()
  vscode.commands.executeCommand(
    'setContext',
    'player-masked',
    config.get('youtube.maskmode', false)
  )
}

export function deactivate() {}
