<template>
  <div class="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white">
    <div class="container mx-auto px-4 py-12 max-w-6xl">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          玩点啥
        </h1>
        <p class="text-xl text-stone-400 mb-2">What to Play</p>
        <p class="text-sm text-stone-500">Game Arcade Collection</p>
      </div>

      <!-- Games Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          v-for="game in games" 
          :key="game.name"
          class="group relative bg-stone-800/50 backdrop-blur rounded-2xl p-6 border border-stone-700/50 hover:border-purple-500/50 transition-all duration-300 cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10"
          @click="$router.push(`/game/${game.route}`)"
        >
          <!-- Game Icon -->
          <div class="text-6xl mb-4 text-center group-hover:scale-110 transition-transform duration-300">
            {{ game.icon }}
          </div>
          
          <!-- Game Info -->
          <h2 class="text-xl font-bold text-center mb-2">{{ game.titleZh }}</h2>
          <p class="text-sm text-stone-400 text-center mb-4">{{ game.titleEn }}</p>
          
          <!-- Play Button -->
          <button 
            class="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium hover:from-purple-500 hover:to-pink-500 transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
            @click.stop="$router.push(`/game/${game.route}`)"
          >
            Play Now →
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-16 text-sm text-stone-600">
        <p>Built with 💜 by Zane</p>
        <p class="mt-1">Ported from <a href="https://znding04.github.io" class="text-purple-400 hover:text-purple-300">znding04.github.io</a></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const games = ref([
  {
    name: 'pong',
    route: 'pong',
    icon: '🏓',
    titleZh: '乒乓球',
    titleEn: 'Pong'
  },
  {
    name: 'snake',
    route: 'snake',
    icon: '🐍',
    titleZh: '贪吃蛇',
    titleEn: 'Snake'
  },
  {
    name: '2048',
    route: '2048',
    icon: '🔢',
    titleZh: '2048',
    titleEn: '2048'
  },
  {
    name: 'tetris',
    route: 'tetris',
    icon: '🧱',
    titleZh: '俄罗斯方块',
    titleEn: 'Tetris'
  },
  {
    name: 'breakout',
    route: 'breakout',
    icon: '🧱',
    titleZh: '打砖块',
    titleEn: 'Breakout'
  },
  {
    name: 'flappy',
    route: 'flappy',
    icon: '🐦',
    titleZh: '飞扬的小鸟',
    titleEn: 'Flappy Bird'
  },
  {
    name: 'space-invaders',
    route: 'space-invaders',
    icon: '👾',
    titleZh: '太空侵略者',
    titleEn: 'Space Invaders'
  },
  {
    name: 'pacman',
    route: 'pacman',
    icon: '👻',
    titleZh: '吃豆人',
    titleEn: 'Pac-Man'
  },
  {
    name: 'memory',
    route: 'memory',
    icon: '🃏',
    titleZh: '记忆翻牌',
    titleEn: 'Memory'
  },
  {
    name: 'minesweeper',
    route: 'minesweeper',
    icon: '💣',
    titleZh: '扫雷',
    titleEn: 'Minesweeper'
  },
  {
    name: 'tictactoe',
    route: 'tictactoe',
    icon: '❌',
    titleZh: '井字棋',
    titleEn: 'Tic-Tac-Toe'
  },
  {
    name: 'crossy',
    route: 'crossy',
    icon: '🐔',
    titleZh: '过马路',
    titleEn: 'Crossy Road'
  }
])
</script>
