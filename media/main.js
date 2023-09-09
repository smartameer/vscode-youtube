(function() {
  const vscode = acquireVsCodeApi()
  const memory = {
    store: (state) => {
      vscode.setState(state)
    },
    clear: () => {
      vscode.setState(null)
    },
    get: () => {
      return vscode.getState()
    }
  }

  const container = {
    body: document.getElementById('container'),
    search: document.getElementById('search')
  }
  const config = {
    handleSearch: function(query) {
      const state = memory.get()
      memory.store({ ...state, query: query })
      vscode.postMessage({
        command: 'search',
        query: query
      })
      vscode.postMessage({
        command: 'player-section',
        state: false
      })
    },
    handlePlay: function(video) {
      const state = memory.get()
      memory.store({ ...state, current: video })
      player.render(video)
      player.toggleVideo(state?.masked)
      vscode.postMessage({
        command: 'player-section',
        state: true
      })
    },
    handleBackToResult: function() {
      const state = memory.get()
      memory.store({ ...state, current: undefined })
      player.showResult(state?.list, state?.layout)
      vscode.postMessage({
        command: 'player-section',
        state: false
      })
    },
    controlChange: function(mode, state) {
      vscode.postMessage({
        command: mode + 'mode',
        state
      })
    }
  }

  const state = memory.get()
  const player = new Player(container, config)
  player.mount(state?.query)
  player.showResult(state?.list, state?.layout)
  if (state.current) {
    player.render(state?.current)
    player.toggleVideo(state?.masked)
    vscode.postMessage({
      command: 'player-section',
      state: true
    })
  }

  window.addEventListener('message', event => {
    const message = event.data
    const state = memory.get()

    switch (message.command) {
      case 'list': {
        memory.store({ ...state, list: message.videos })
        player.showResult(message.videos, state.layout)
        break
      }
      case 'search': {
        memory.store({ ...state, query: message.query })
        player.mount(message?.query)
        break
      }
      case 'layout': {
        memory.store({ ...state, layout: message.mode })
        player.showResult(state.list, message.mode)
        break
      }
      case 'mask': {
        memory.store({ ...state, masked: message.hidden })
        player.toggleVideo(message.hidden)
        break
      }
      case 'play': {
        player.toggleControl('play', message.state)
        break
      }
      case 'mute': {
        player.toggleControl('mute', message.state)
        break
      }
    }
  })

})()
