<template>
  <div class="App min-h-screen bg-gray-50">
    <!-- 상위 메뉴 -->
    <nav class="App-top-menu bg-white shadow-sm border-b">
      <div class="container mx-auto px-4">
        <div class="flex space-x-4">
          <router-link
            to="/"
            class="top-menu-btn px-4 py-3 text-gray-700 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600 transition-colors"
            active-class="text-blue-600 border-blue-600"
          >
            홈
          </router-link>
          <router-link
            to="/marketing-automation"
            class="top-menu-btn px-4 py-3 text-gray-700 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600 transition-colors"
            active-class="text-blue-600 border-blue-600"
          >
            마케팅자동화
          </router-link>
          <router-link
            to="/ai-bot"
            class="top-menu-btn px-4 py-3 text-gray-700 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600 transition-colors"
            active-class="text-blue-600 border-blue-600"
          >
            AI 알림봇
          </router-link>
        </div>
      </div>
    </nav>

    <!-- 페이지 컨텐츠 -->
    <router-view />
  </div>
</template>

<script setup>
</script>

<style>
#app {
  min-height: 100vh;
}
</style>

