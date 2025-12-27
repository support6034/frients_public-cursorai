<template>
  <div class="home-page min-h-screen bg-gray-50">
    <div class="home-hero py-16 px-4 text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">마케팅 자동화 플랫폼</h1>
      <p class="text-xl text-gray-600">효율적인 마케팅 자동화 도구를 선택하세요</p>
    </div>

    <div class="home-menu-grid max-w-6xl mx-auto px-4 pb-16 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div 
        class="menu-card bg-white rounded-lg shadow-md p-8 cursor-pointer hover:shadow-lg transition-shadow relative"
        @click="$router.push('/marketing-automation')"
      >
        <div class="menu-card-icon mb-4 text-blue-600">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">마케팅자동화</h2>
        <p class="text-gray-600 mb-4">GTM 이벤트를 웹훅으로 자동 전달하는 워크플로우 시스템</p>
        <div class="menu-card-arrow text-blue-600 text-2xl absolute bottom-4 right-4">→</div>
      </div>

      <div 
        class="menu-card bg-white rounded-lg shadow-md p-8 cursor-pointer hover:shadow-lg transition-shadow relative"
        @click="$router.push('/ai-bot')"
      >
        <div class="menu-card-icon mb-4 text-purple-600">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">AI 알림봇</h2>
        <p class="text-gray-600 mb-4">쇼핑몰 주문 알림톡 자동 발송 서비스</p>
        <div class="menu-card-arrow text-purple-600 text-2xl absolute bottom-4 right-4">→</div>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.home-page {
  min-height: 100vh;
}
</style>

