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
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const gameContainer = ref(null)
const loading = ref(true)

const games = {
  pong: { titleZh: '乒乓球', titleEn: 'Pong', icon: '🏓', script: '/games/pong.js' },
  snake: { titleZh: '贪吃蛇', titleEn: 'Snake', icon: '🐍', script: '/games/snake.js' },
  '2048': { titleZh: '2048', titleEn: '2048', icon: '🔢', script: '/games/2048.js' },
  tetris: { titleZh: '俄罗斯方块', titleEn: 'Tetris', icon: '🧱', script: '/games/tetris.js' }
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

async function loadGame() {
  loading.value = true
  
  try {
    // Dynamically load the game script
    await loadScript(currentGame.value.script)
    
    // Wait a bit for script to initialize
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Initialize the game if there's an init function
    if (typeof window.initGame === 'function') {
      window.initGame(gameContainer.value)
    }
    
    loading.value = false
  } catch (err) {
    console.error('Failed to load game:', err)
    loading.value = false
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    // Check if script already loaded
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      resolve()
      return
    }
    
    const script = document.createElement('script')
    script.src = src
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
