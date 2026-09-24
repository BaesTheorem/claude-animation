// Bundled as a classic script (window.THREE) so studio.html works from file:// without ES module loading.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
window.THREE = { ...THREE, GLTFLoader, SkeletonUtils, BufferGeometryUtils };
