<template>
  <div class="about">
    <h1>This is an about page</h1>
  </div>
</template>
<script>
import axios from 'axios'
export default {
  methods: {
    vueError () {
      this.testError()
    },
    promiseError () {
      const test = new Promise(() => {
        this.testError()
      })
      test.then()
    },
    httpError () {
      axios({
        method: 'get',
        url: '/test/test'
      })
      fetch('/test/test')
    }
  },
  created () {
    this.vueError()
    this.promiseError()
    this.httpError()
  }
}
</script>
