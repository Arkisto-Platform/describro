<script setup>
import {onMounted, onUpdated, reactive, toRaw} from "vue";
import EntityInput from "@/components/EntityInput.vue";
import {find} from 'lodash';

const props = defineProps(['value', 'property', 'index', 'definitions']);
const data = reactive({
  newValue: props.value,
  showNewItem: false
});

const emit = defineEmits(['updateEntity', 'loadEntity'])

function loadEntity(id) {
  emit('loadEntity', id);
}

function newItem({type, event}) {
  data.showNewItem = type;
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
          <div v-for="t of definition?.type">
            <el-button type="default" v-if="definition?.multiple" v-show="data.showNewItem !== t"
                       @click="newItem({type: t, event: $event})">+&nbsp;{{ t }}
            </el-button>
            <div v-if="data.showNewItem === t">
              <div>
                <el-button @click="()=>data.showNewItem = ''">x</el-button>
                <div>
                  <br>
                  Auto complete here...
                  <br/>
                </div>
              </div>
            </div>
          </div>
        </div>
        <el-alert v-if="definition?.help" :title="definition?.help" type="info" :closable="false"/>
      </div>
    </el-col>
  </el-form-item>
</template>