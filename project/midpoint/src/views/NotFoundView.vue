<template>
  <section class="state" data-testid="not-found">
    <h2>404</h2>
    <p>요청한 페이지를 찾을 수 없습니다.</p>
    <RouterLink :to="{ name: 'post-list' }">목록으로 돌아가기</RouterLink>
  </section>
</template>
