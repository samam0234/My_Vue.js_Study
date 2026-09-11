<script setup>
import TemplateSyntaxPractice from '../components/TemplateSyntaxPractice.vue'
import RefReactivePractice from '../components/RefReactivePractice.vue'
import ComputedPractice from '../components/ComputedPractice.vue'
import WatchPractice from '../components/WatchPractice.vue'
import LifecyclePractice from '../components/LifecyclePractice.vue'
import PropsEmitPractice from '../components/PropsEmitPractice.vue'
import FormValidationPractice from '../components/FormValidationPractice.vue'
import FetchApiPractice from '../components/FetchApiPractice.vue'
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

    <!-- study3: 컴포넌트 props/emit -->
    <PropsEmitPractice />

    <!-- study5: 폼 검증 (study4는 별도 라우트: /products) -->
    <FormValidationPractice />

    <!-- study6: fetch API 호출 -->
    <FetchApiPractice />

    <TheWelcome />
  </main>
</template>
