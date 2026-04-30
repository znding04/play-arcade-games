<template>
  <div class="min-h-screen bg-stone-900 text-white">
    <!-- Header Bar -->
    <div class="bg-stone-800/80 backdrop-blur border-b border-stone-700 px-4 py-3 flex items-center justify-between">
      <button
        @click="$router.push('/')"
        class="flex items-center gap-2 text-stone-400 hover:text-white transition-colors"
      >
        <span class="text-xl">←</span>
        <span>Back to Arcade</span>
      </button>

      <h1 class="text-xl font-bold">{{ currentGame?.titleZh || 'Game' }}</h1>

      <div class="text-right">
        <div class="text-sm text-stone-400">{{ currentGame?.titleEn || '' }}</div>
      </div>
    </div>

    <!-- Game Container -->
    <div class="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
      <div class="game-wrapper relative">
        <!-- Game Canvas/Container will be injected here -->
        <div ref="gameContainer" class="bg-stone-800 rounded-xl overflow-hidden shadow-2xl"></div>

        <!-- Loading State -->
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-stone-800/90 rounded-xl">
          <div class="text-center">
            <div class="text-4xl mb-4 animate-bounce">{{ currentGame?.icon || '🎮' }}</div>
            <p class="text-stone-400">Loading game...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const gameContainer = ref(null)
const loading = ref(true)

const games = {
  pong: { titleZh: '乒乓球', titleEn: 'Pong', icon: '🏓', script: '/games/pong.js' },
  snake: { titleZh: '贪吃蛇', titleEn: 'Snake', icon: '🐍', script: '/games/snake.js' },
  '2048': { titleZh: '2048', titleEn: '2048', icon: '🔢', script: '/games/2048.js' },
  tetris: { titleZh: '俄罗斯方块', titleEn: 'Tetris', icon: '🧱', script: '/games/tetris.js' },
  breakout: { titleZh: '打砖块', titleEn: 'Breakout', icon: '🧱', script: '/games/breakout.js' },
  flappy: { titleZh: '飞扬的小鸟', titleEn: 'Flappy Bird', icon: '🐦', script: '/games/flappy.js' },
  'space-invaders': { titleZh: '太空侵略者', titleEn: 'Space Invaders', icon: '👾', script: '/games/space-invaders.js' },
  pacman: { titleZh: '吃豆人', titleEn: 'Pac-Man', icon: '👻', script: '/games/pacman.js' },
  memory: { titleZh: '记忆翻牌', titleEn: 'Memory', icon: '🃏', script: '/games/memory.js' },
  minesweeper: { titleZh: '扫雷', titleEn: 'Minesweeper', icon: '💣', script: '/games/minesweeper.js' },
  tictactoe: { titleZh: '井字棋', titleEn: 'Tic-Tac-Toe', icon: '❌', script: '/games/tictactoe.js' },
  crossy: { titleZh: '过马路', titleEn: 'Crossy Road', icon: '🐔', script: '/games/crossy.js' }
}

const currentGame = computed(() => {
  const gameName = route.params.gameName
  return games[gameName] || null
})

onMounted(() => {
  if (!currentGame.value) {
    router.push('/')
    return
  }
  loadGame()
})

onBeforeUnmount(() => {
  cleanupPreviousGame()
})

function cleanupPreviousGame() {
  // Run any cleanup the previous game registered (cancel rAF, remove listeners, etc.)
  if (typeof window.__gameCleanup === 'function') {
    try { window.__gameCleanup() } catch (e) { console.error('game cleanup failed', e) }
  }
  window.__gameCleanup = null
  window.initGame = null

  // Remove any previously-injected game scripts so the next one re-evaluates cleanly.
  document.querySelectorAll('script[data-arcade-game]').forEach(s => s.remove())
}

async function loadGame() {
  loading.value = true
  cleanupPreviousGame()

  try {
    await loadScript(currentGame.value.script)
    await new Promise(resolve => setTimeout(resolve, 50))

    if (typeof window.initGame === 'function') {
      window.initGame(gameContainer.value)
    } else {
      console.error('Game script did not register window.initGame:', currentGame.value.script)
    }

    loading.value = false
  } catch (err) {
    console.error('Failed to load game:', err)
    loading.value = false
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.dataset.arcadeGame = '1'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.body.appendChild(script)
  })
}
</script>

<style scoped>
.game-wrapper {
  max-width: 100%;
  display: flex;
  justify-content: center;
}
</style>
