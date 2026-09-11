<script setup>
import TemplateSyntaxPractice from '../components/TemplateSyntaxPractice.vue'
import RefReactivePractice from '../components/RefReactivePractice.vue'
import ComputedPractice from '../components/ComputedPractice.vue'
import WatchPractice from '../components/WatchPractice.vue'
import LifecyclePractice from '../components/LifecyclePractice.vue'
import TheWelcome from '../components/TheWelcome.vue'
</script>

<template>
  <main>
    <!-- study1: 템플릿 문법 -->
    <TemplateSyntaxPractice />

    <!-- study2: 반응형 상태 -->
    <RefReactivePractice />
    <ComputedPractice />
    <WatchPractice />
    <LifecyclePractice />

    <TheWelcome />
  </main>
</template>
