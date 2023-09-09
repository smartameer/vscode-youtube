(function (global, m) {

  function Player (container, config) {
    this.container = container
    this.config = config
    this.player = null
    return this
  }

  Player.prototype = {
    toggleControl: function(mode, state) {
      try {
        switch (mode) {
          case 'play': {
            state ? this.player.playVideo() : this.player.pauseVideo()
            break
          }
          case 'mute': {
            state ? this.player.mute() : this.player.unMute()
            break
          }
        }
      } catch (error) {
        console.log('Unable to render player or control')
      }
    },
    render: function(video) {
      const that = this
      m.render(this.container.body, [
        m('div', {
          class: 'player',
          'data-vscode-context': JSON.stringify({
            preventDefaultContextMenuItems: true,
            webviewSection: 'player',
            video: video.url
          })
        }, [
          m('div', { class: 'control' }, [
            m('button', {
              class: 'back',
              title: 'Back to search result',
              onclick: function(event) {
                event.preventDefault()
                that.config.handleBackToResult()
              }
            }, '⇠'),
            m('span', { class: 'title', title: video.description }, video.title),
            m('span')
            // m('button', {
            //   class: 'bookmark',
            //   title: 'Bookmark',
            //   onclick: function(event) {
            //     event.preventDefault()
            //     that.config.saveToList()
            //   }
            // }, '☆'),
          ]),
          m('div', { class: 'wrapper', id: "player-wrapper" }, [
            m('div', { id: 'player-body' })
          ])
        ])
      ])
      global.onYouTubeIframeAPIReady = null;
      global.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
        that.player = new YT.Player('player-body', {
          height: '100%',
          width: '100%',
          videoId: video.videoId,
          title: video.title,
          frameborder: 0,
          wmode: 'transparent',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;',
          sandbox: 'allow-presentation allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox',
          events: {
            onError: function (error) {
              if (error.data == '150') {
                m.render(global.document.getElementById('player-wrapper'), [
                  m('p', { class: 'player-error' }, 'Sorry. This video contains content from ' + video.author.name + '. It is restricted from playback on certain sites or applications.'),
                ])
              }
            },
            onStateChange: function (event) {
              that.config.controlChange('play', event.data == YT.PlayerState.PLAYING)
            }
          }
        })
      }

      if (global.document.getElementById('youtube-script') !== null) {
          that.player = null;
          global.onYouTubeIframeAPIReady()
      } else {
        let nonce = ''
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        for (let i = 0; i < 32; i++) {
          nonce += possible.charAt(Math.floor(Math.random() * possible.length))
        }
        const tag = global.document.createElement('script')
        tag.src = 'https://www.youtube.com/player_api'
        tag.id = 'youtube-script'
        tag.setAttribute('nonce', nonce)
        const firstScriptTag = global.document.getElementsByTagName('script')[0]
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
      }
    },
    toggleVideo: function(hidden) {
      const player = document.getElementById('player-wrapper')
      if (player === null) {
        return;
      }
      hidden ? player.classList.add('hidden') : player.classList.remove('hidden')
    },
    mount: function (defaultValue) {
      const that = this
      m.render(this.container.search, [
        m('input[type=search][placeholder=Search video ...]', {
          class: 'search-input',
          value: defaultValue || '',
          onkeyup: function(event) {
            const query = event.target.value
            event.preventDefault()
            event.stopPropagation()
            if (event.keyCode === 13) {
              if (query !== null
                && query.trim() !== ''
                && query.trim().length > 2
              ) {
                return that.config.handleSearch(query)
              }
              that.config.handleSearch(false)
            }
            return false
          }
        })
      ])
    },
    showResult: function (videos, layout, cb) {
      const that = this
      let mode = layout || 'list'
      if ((videos && videos.length <= 0) || videos === null || videos === undefined) {
        return
      }
      if (mode === 'list') {
        m.render(this.container.body, [
          m('section', { class: 'list-mode', 'data-vscode-context': '{"preventDefaultContextMenuItems": true, "webviewSection": "main" }' }, [
            m('ul', { class: 'video-list' }, videos.map(function(video, index) {
              const link = m('div', { class: 'video-link' }, [
                m('div', { class: 'video-thumb'}, [
                  m('img', { class: 'video-image', src: video.thumbnail, alt: video.title })
                ]),
                m('div', { class: 'video-details' }, [
                  m('div', { class: 'video-title', title: video.title }, video.title),
                  m('div', { class: 'video-extra' }, [
                    m('div', { class: 'video-author', title: 'Author' }, video.author.name),
                    m('div', { class: 'video-meta' }, [
                      m('span', { class: 'video-metainfo' }, [
                        m('span', { title: 'Duration' }, video.timestamp),
                        m('span', ' • '),
                        m('span', { title: 'Views' }, convertNumber(video.views) + ' views')
                      ]),
                      m('span', { class: 'video-metainfo', title: 'Uploaded' }, video.ago),
                    ]),
                  ])
                ])
              ])
              return m('li', {
                class: 'video-item',
                'data-vscode-context': JSON.stringify({
                  preventDefaultContextMenuItems: true,
                  webviewSection: 'item',
                  video: video.url
                }),
                onclick: function(event) {
                  event.preventDefault()
                  return that.config.handlePlay(video)
                }
              }, link)
            }))
          ])
        ])
      }
      if (mode === 'grid') {
        m.render(this.container.body, [
          m('section', { class: 'grid-mode', 'data-vscode-context': '{"preventDefaultContextMenuItems": true, "webviewSection": "main" }' }, [
            m('div', { class: 'video-list' }, videos.map(function(video, index) {
              const link = m('div', { class: 'video-link' }, [
                m('div', { class: 'video-thumb'}, [
                  m('img', { class: 'video-image', src: video.thumbnail, alt: video.title })
                ]),
                m('div', { class: 'video-details' }, [
                  m('div', { class: 'video-title', title: video.title }, video.title),
                  m('div', { class: 'video-extra' }, [
                    m('div', { class: 'video-author', title: 'Author' }, video.author.name),
                    m('div', { class: 'video-meta' }, [
                      m('small', { class: 'video-metainfo', title: 'Duration' }, convertNumber(video.views) + ' views'),
                      m('small', { class: 'video-metainfo', title: 'Uploaded' }, video.ago),
                    ]),
                  ])
                ])
              ])
              return m('div', {
                class: 'video-item',
                'data-vscode-context': JSON.stringify({
                  preventDefaultContextMenuItems: true,
                  webviewSection: 'item',
                  video: video.url
                }),
                onclick: function(event) {
                  event.preventDefault()
                  return that.config.handlePlay(video)
                }
              }, link)
            }))
          ])
        ])
      }
      if (mode === 'compact') {
        m.render(this.container.body, [
          m('section', { class: 'compact-mode', 'data-vscode-context': '{"preventDefaultContextMenuItems": true, , "webviewSection": "main" }' }, [
            m('ul', { class: 'video-list' }, videos.map(function(video, index) {
              return m('li', {
                class: 'video-item',
                'data-vscode-context': JSON.stringify({
                  preventDefaultContextMenuItems: true,
                  webviewSection: 'item',
                  video
                }),
                onclick: function(event) {
                  event.preventDefault()
                  return that.config.handlePlay(video)
                }
              }, [
                m('div', { class: 'video-details' }, [
                  m('div', { class: 'video-title', title: video.title }, video.title),
                  m('small', { class: 'video-duration', title: 'Duration' }, video.timestamp),
                ]),
                m('div', { class: 'video-author', title: 'Author' }, video.author.name),
              ])
            }))
          ])
        ])
      }
    }
  }

  const convertNumber = function (views) {

    // Nine Zeroes for Billions
    return Math.abs(Number(views)) >= 1.0e+9
      ? (Math.abs(Number(views)) / 1.0e+9).toFixed(1) + "B"
      : Math.abs(Number(views)) >= 1.0e+6
        ? (Math.abs(Number(views)) / 1.0e+6).toFixed(1) + "M"
        : Math.abs(Number(views)) >= 1.0e+3
          ? (Math.abs(Number(views)) / 1.0e+3).toFixed(1) + "K"
          : Math.abs(Number(views));
  }
  global.Player = Player
})(this, m)