<script setup>
import {ref, reactive, inject, computed, toRaw} from 'vue';
import {profiles} from '../profiles';
import emptyCrate from '../assets/empty-crate.json';
import {ROCrate} from 'ro-crate';
import {Lookup} from '../lookup';
import EntityInput from "@/components/entity-input.component.vue";

function loadEntity(id) {
  console.log('hello', id);
  data.entity = data.crate.getItem(id);
}

const lookup = new Lookup();

const selectedProfile = 1;
const data = reactive({
  test: 'a',
  crate: {},
  entity: {},
  profile: profiles[selectedProfile],
  loading: false,
  /** @type {?FileSystemFileHandle} */
  metadataHandle: null,
  /** @type {?FileSystemDirectoryHandle} */
  dirHandle: null,
  selectedProfile: selectedProfile
});

const notThisFiles = [
  'ro-crate-metadata.json',
  '.DS_Store',
  '.git',
  'node_modules'
];

var latestCrate = emptyCrate;
let crate;

const commands = {
  async newCrate() {
    data.crate = emptyCrate;
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
    data.crate = JSON.parse(content);
  },

  async open() {
    try {
      data.dirHandle = await window.showDirectoryPicker();
      // reset crate
      data.metadataHandle = null;
      let crate = emptyCrate;
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
      data.crate = crate;
      data.entity = crate.rootDataset;
    } catch (error) {
      console.log(error);
    }
  },

  async addFiles() {
    const crate = new ROCrate(data.crate);
    const dirHandle = data.dirHandle;
    await processFiles({crate, dirHandle, root: ''});
    data.crate = crate.toJSON();
  },

  async save() {
    console.log(data);
    debugger
    console.log(data.entity);
    console.log(data.crate);
    debugger;
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
      const content = JSON.stringify(data.crate, null, 2);
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

function saveCrate({crate}) {
  latestCrate = crate;
}

function testChange() {
  console.log(data.test);
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
    <!--    <describo-crate-builder v-loading="data.loading" @ready="data.loading = false" @save:crate="saveCrate"-->
    <!--                            :crate="data.crate" :profile="data.profile" :lookup="lookup">-->
    <!--    </describo-crate-builder>-->
  </div>
</template>

<style>

</style>
