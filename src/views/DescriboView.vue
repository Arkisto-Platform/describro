<script setup>
import {reactive, onMounted, watch, onUpdated, toRaw} from 'vue';
import {useRouter, useRoute} from 'vue-router'
import {profiles} from '@/profiles';
import {ROCrate} from 'ro-crate';
import {Lookup} from '@/lookup';
import EntityProperty from "@/components/EntityProperty.vue";
import {first, find} from 'lodash';
import {v4 as uuidv4} from 'uuid';

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

function updateBreadcrumb(index) {
  data.breadcrumb.splice(index + 1, data.breadcrumb.length - (index + 1));
  updateRoute(data.breadcrumb[index]['@id']);
}

function loadEntity(id) {
  data.entity = crate.getItem(id);
  $router.push({query: {id: encodeURIComponent(id)}});
  if (id !== data.rootId) {
    const index = data.breadcrumb.findIndex(b => b['@id'] === id);
    if (index >= 0) {
      data.breadcrumb.splice(index + 1, data.breadcrumb.length - (index + 1));
    } else {
      data.breadcrumb.push(data.entity);
    }
  } else {
    data.breadcrumb = [];
  }
  data.definitions = getProfileClasses();
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
  breadcrumb: [],
  definitions: []
});

onMounted(() => {
  console.log(`Route: $route.query.id`);
});

function getProfileClasses(type) {
  const classes = data.profile?.classes;
  let types = type || data.entity?.['@type'];
  const defs = [];
  for (let c of Object.keys(classes)) {
    if (types.includes(c)) {
      defs.push(classes[c])
    }
  }
  return defs;
}

function findPropertyDefinition(property) {
  const inputs = [];
  for (const defs of data.definitions) {
    const def = find(defs.inputs, p => p.name === property);
    inputs.push(def);
  }
  //TODO: Merge the inputs definitions?
  return inputs;
}

watch($route, (c, o) => {
  if (!data.metadataHandle) { //checking crate if it has not been loaded
    window.alert('Directory not loaded!');
  } else {
    if (c.query.newItem) {

    } else {
      const id = decodeURIComponent(c.query?.id);
      if (id) {
        loadEntity(id);
      }
    }
  }
});

function updateRoute(id) {
  $router.push({query: {id: encodeURIComponent(id)}});
  loadEntity(id);
}

const commands = {
  async newCrate() {
    crate = new ROCrate({}, {array: true, link: true});
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
      data.definitions = getProfileClasses();
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

function updateEntity({property, index, value, event}) {
  if (property === '@id') {
    data.entity[property] = event.target.value;
  } else {
    const prop = data.entity[property];
    prop[index] = event.target.value;
    data.entity[property] = prop;
  }
}

function addItem({reference, type, property}) {
  $router.push({query: {newItem: true, type: type}});
  const classes = data.profile?.classes;
  const definitions = classes?.[type];
  const newItem = {
    "@id": `#${uuidv4()}`,
    "@type": type
  }
  const inputs = definitions?.inputs;
  for (let item of inputs) {
    if (item.multiple) { // does this matter?
      newItem[item.name] = [""];
    } else {
      newItem[item.name] = "";
    }
  }
  crate.addValues(reference, property, newItem);
  data.entity = crate.getItem(newItem['@id']);
}

</script>

<template>
  <el-form :inline="true" class="bg-slate-200 p-2">
    <el-form-item class="">
      <el-dropdown trigger="click" @command="handleFileCommand">
        <el-button type="primary">File &nbsp;<i class="fa-solid fa-caret-down"></i></el-button>
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
        <span v-for="(b,i) in data.breadcrumb">
        <el-button :link="true"
                   @click="updateBreadcrumb(i)"
                   :disabled="b['@id'] === data.entity['@id']"
        >{{ b.name?.[0] || b['@id'] }}
        </el-button>
        /
      </span>
      </el-row>
    </el-col>
    <el-row class="p-2">
      <el-col :span="24">
        <el-form label-width="150px">
          <entity-property v-for="(value, property, index) in data.entity"
                           :key="property + '_' + value"
                           :property="property" :value="value" :index="index"
                           :id="data.entity['@id']"
                           @load-entity="loadEntity" @update-entity="updateEntity"
                           :definitions="findPropertyDefinition(property)"
                           @add-item="addItem"/>
        </el-form>
      </el-col>
    </el-row>
  </div>
  <div v-else class="flex items-center justify-center h-[calc(100vh-110px)] overflow-auto">
    <div class="font-bold rounded-lg border shadow-lg p-10">
      Welcome to Crate-O <br/>
      Select File to start
    </div>
  </div>

</template>

<style>

</style>
