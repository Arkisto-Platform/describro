<script setup>
import {reactive} from "vue";

const props = defineProps(['name', 'value', 'index']);

const data = reactive({
  newValue: props.value
});

const emit = defineEmits(['updateValue', 'newEntity'])

</script>
<template>
  <el-button v-if="value['@id']"
             :name="name"
             :id="name"
             @click="$emit('newEntity', value['@id'])">
    {{ value['name']?.[0] || value['@id'] }}
  </el-button>
  <el-input v-else
            :name="name"
            :id="name"
            type="text"
            v-model="data.newValue"/>
</template>