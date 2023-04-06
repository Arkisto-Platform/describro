<script setup>
import {reactive, onMounted, onUpdated} from 'vue';
import {useRouter, useRoute} from 'vue-router'
import {profiles} from '../profiles';
import emptyCrate from '../assets/empty-crate.json';
import {ROCrate} from 'ro-crate';
import {Lookup} from '../lookup';
import EntityInput from "@/components/entity-input.component.vue";
import {first} from 'lodash';

const $router = useRouter();
const $route = useRoute();

let crate;
const lookup = new Lookup();
const selectedProfile = 1;
const notThisFiles = [
  'ro-crate-metadata.json',
  '.DS_Store',
  '.git',
  'node_modules'
];

function loadEntity(id) {
  data.entity = crate.getItem(id);
  $router.push({query: {id: encodeURIComponent(id)}});
  if (id !== data.rootId) {
    const index = data.breadcrumb.findIndex(b => b.id === id);
    if (index >= 0) {
      data.breadcrumb.splice(index + 1, data.breadcrumb.length - (index + 1));
    } else {
      data.breadcrumb.push({id, name: data.entity?.['name']?.[0] || data.entity['@id']});
    }
  } else {
    data.breadcrumb = [];
  }
}

const data = reactive({
  test: 'a',
  entity: {},
  rootId: '',
  rootName: '',
  profile: profiles[selectedProfile],
  loading: false,
  /** @type {?FileSystemFileHandle} */
  metadataHandle: null,
  /** @type {?FileSystemDirectoryHandle} */
  dirHandle: null,
  selectedProfile: selectedProfile,
  breadcrumb: []
});

onMounted(() => {
  console.log($route.query.id);
});

function updateRoute(id) {
  $router.push({query: {id: encodeURIComponent(id)}});
  loadEntity(id);
}

var latestCrate = emptyCrate;

const commands = {
  async newCrate() {
    crate = emptyCrate;
    data.metadataHandle = null;
  },
  async openFile() {
    [data.metadataHandle] = await window.showOpenFilePicker({
      types: [{
        description: 'RO-Crate Metadata File', accept: {
          'application/ld+json': ['.jsonld'], 'application/json': ['.json']
        }
      }]
    });
    let file = await data.metadataHandle.getFile();
    const content = await file.text();
    //console.log(content);
    crate = JSON.parse(content);
  },

  async open() {
    try {
      data.dirHandle = await window.showDirectoryPicker();
      // reset crate
      data.metadataHandle = null;
      crate = new ROCrate({}, {array: true, link: true});
      try {
        data.metadataHandle = await data.dirHandle.getFileHandle('ro-crate-metadata.json');
      } catch (error) {
        try {
          data.metadataHandle = await data.dirHandle.getFileHandle('ro-crate-metadata.jsonld');
        } catch (error) {
        }
      }
      if (data.metadataHandle) {
        let file = await data.metadataHandle.getFile();
        const content = await file.text();
        //console.log(content);
        crate = new ROCrate(JSON.parse(content), {array: true, link: true});
      }
      data.entity = crate.rootDataset;
      data.rootId = crate.rootId;
      data.rootName = first(crate.rootDataset['name']) || 'Start';
      $router.push({query: {id: encodeURIComponent(crate.rootId)}});
    } catch (error) {
      console.log(error);
    }
  },

  async addFiles() {
    let newCrate = new ROCrate(crate);
    const dirHandle = data.dirHandle;
    await processFiles({crate, dirHandle, root: ''});
    //crate = newCrate.toJSON();
  },

  async save() {
    if (data.dirHandle) {
      // create new crate metadata
      data.metadataHandle = await data.dirHandle.getFileHandle('ro-crate-metadata.json', {create: true});
    } else {
      try {
        data.metadataHandle = await window.showSaveFilePicker({
          suggestedName: 'ro-crate-metadata.json',
          types: [{
            description: 'RO-Crate Metadata File',
            accept: {'application/json': ['.json']}
          }]
        });
      } catch (error) {
      }
    }
    if (data.metadataHandle) {
      const writable = await data.metadataHandle.createWritable();
      const content = JSON.stringify(crate, null, 2);
      await writable.write(content);
      await writable.close();
    }
  }
};

function changeProfile(index) {
  data.profile = profiles[index];

}

function handleFileCommand(command) {
  if (command in commands) commands[command]();
}

async function processFiles({crate, dirHandle, root}) {

  for await (const [key, handle] of dirHandle.entries()) {
    let filePath = root ? root + '/' + key : key;
    if (handle.kind === 'directory' && !notThisFiles.includes(key)) {
      await processFiles({crate, dirHandle: handle, root: filePath});
    } else if (handle.kind === 'file' && !notThisFiles.includes(key)) {
      const file = {
        "@id": filePath,
        "@type": "File"
      }
      crate.addValues(crate.rootDataset, 'hasPart', file);
    }
  }
}

function updateEntity(property, index, value, event) {
  const prop = data.entity[property];
  prop[index] = event;
  data.entity[property] = prop;
}

</script>

<template>
  <el-form :inline="true" class="bg-slate-200 p-2">
    <el-form-item class="">
      <el-dropdown trigger="click" @command="handleFileCommand">
        <el-button type="primary">File &nbsp; <i class="fa-solid fa-caret-down"></i></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="open">
              <el-tooltip effect="dark" placement="right"
                          content="Open a directory to describe or select an empty directory">
                Open Directory
              </el-tooltip>
            </el-dropdown-item>
            <el-dropdown-item command="addFiles" :disabled="data.dirHandle?.name === undefined">
              <el-tooltip effect="dark" placement="right"
                          content="Load Files (With Selected Directory)">
                Load Files
              </el-tooltip>
            </el-dropdown-item>
            <el-dropdown-item command="save">
              <el-tooltip effect="dark" placement="right"
                          content="Save crate metadata to the currently opened directory">
                Save Progress
              </el-tooltip>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-form-item>
    <el-form-item label="Profile:" class="w-8/12">
      <el-select v-model="data.selectedProfile" class="w-full" placeholder="Select" @change="changeProfile">
        <el-option v-for="(profile, index) of profiles" :label="profile.metadata.name" :value="index" class="w-auto">
          <span>{{ profile.metadata.name }}</span>&nbsp;
          <span>{{ profile.metadata.description }}</span>
        </el-option>
      </el-select>
    </el-form-item>
    <div v-if="data.dirHandle" class="text-large font-600">Selected Directory: {{ data.dirHandle.name }}</div>
  </el-form>
  <div class="describo" v-if="data.dirHandle">
    <el-col :span="24">
      <el-row class="p-2">
      <span>
        <el-button :link="true"
                   @click="updateRoute(data.rootId)">
          {{ data.rootName }}
        </el-button>
        /
      </span>
        <span v-for="b in data.breadcrumb">
        <el-button :link="true"
                   @click="updateRoute(b.id)"
                   :disabled="b.id === data.entity['@id']"
                   v-if="data.entity['@id'] !== data.rootId">{{ b.name }}
        </el-button>
        /
      </span>
      </el-row>
    </el-col>
    <el-row class="p-2">
      <el-col :span="24">
        <el-form>
          <el-form-item :label="property" v-for="(value, property, index) in data.entity"
                        class="w-full"
                        :key="property + '_' + value">
            <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="py-1">
              <entity-input v-if="Array.isArray(value)"
                            v-for="(v,i) of value"
                            :index="i"
                            :name="property + '_' + i"
                            :value="v"
                            @change="updateEntity(property, i, v, $event)"
                            @new-entity="loadEntity"/>
              <entity-input v-else
                            :index="index"
                            :name="property + '_' + index"
                            :value="value"
                            @change="updateEntity(property, index, value, $event)"
                            @new-entity="loadEntity"
                            :disabled="property === '@id'"/>
            </el-col>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
  </div>
</template>

<style>

</style>
