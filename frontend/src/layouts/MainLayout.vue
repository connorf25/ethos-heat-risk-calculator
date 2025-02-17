<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <img src="ethos.svg" height="40" class="q-mr-sm" />
        <q-toolbar-title> Heat Risk Calculator </q-toolbar-title>
        <q-space />
        <q-btn
          v-if="$route.path !== '/'"
          @click="$router.push('/')"
          label="edit"
          color="secondary"
          class="q-mr-md"
        />
        <q-btn label="clear" color="negative " @click="showCloseModal = true" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
  <q-dialog v-model="showCloseModal">
    <q-card>
      <q-card-section>
        <div class="text-h6">Warning</div>
      </q-card-section>
      <q-card-section class="row items-center">
        <span> Do you wish to clear all data and return to start?</span>
      </q-card-section>

      <q-card-actions>
        <q-btn flat label="Cancel" color="secondary" v-close-popup />
        <q-space />
        <q-btn flat label="No" color="negative" v-close-popup />
        <q-btn label="Yes" color="positive" v-close-popup @click="clearDataAndReturnToStart" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useInputParametersStore } from 'src/stores/inputParameters'
import { useRouter } from 'vue-router'

const router = useRouter()
const inputParametersStore = useInputParametersStore()
const showCloseModal = ref(false)

const clearDataAndReturnToStart = async () => {
  inputParametersStore.$reset()
  await router.replace('/')
}
</script>
