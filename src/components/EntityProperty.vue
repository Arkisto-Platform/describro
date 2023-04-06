<script setup>
import {onMounted, onUpdated, reactive, toRaw} from "vue";
import EntityInput from "@/components/EntityInput.vue";
import {find} from 'lodash';

const props = defineProps(['value', 'property', 'index', 'definitions']);
const data = reactive({
  newValue: props.value
});

const emit = defineEmits(['updateEntity', 'loadEntity'])

function loadEntity(id) {
  emit('loadEntity', id);
}

onMounted(() => {
  console.log();
})

</script>
<template>
  <el-form-item :label="property"
                class="w-full">
    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="py-1">
      <entity-input v-if="Array.isArray(value)"
                    v-for="(v,i) of value"
                    :index="i"
                    :name="property + '_' + i"
                    :value="v"
                    @change="$emit('updateEntity', {property, index: i, value: v, event: $event})"
                    @new-entity="loadEntity"/>
      <entity-input v-else
                    :index="index"
                    :name="property + '_' + index"
                    :value="value"
                    @change="$emit('updateEntity', {property, index, value, event: $event})"
                    @new-entity="loadEntity"
                    :disabled="property === '@id'"/>
      <div v-for="definition in definitions">
        <div v-if="definition?.type">
          <el-button-group v-for="t of definition?.type">
            <el-button type="default" v-if="definition?.multiple">+&nbsp;{{ t }}</el-button>
          </el-button-group>
        </div>
        <div>{{ definition?.help }}</div>
      </div>
    </el-col>
  </el-form-item>
</template>