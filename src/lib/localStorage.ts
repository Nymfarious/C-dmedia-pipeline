import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from 'idb-keyval';
import { Asset } from '@/types/media';

export interface ProjectData {
  id: string;
  name: string;
  assets: Record<string, Asset>;
  currentAssetId?: string;
  createdAt: number;
  updatedAt: number;
}

const PROJECTS_KEY = 'saved-projects';
const CURRENT_SESSION_KEY = 'current-session';

export async function saveProject(name: string, assets: Record<string, Asset>, currentAssetId?: string): Promise<string> {
  const projectId = crypto.randomUUID();
  const project: ProjectData = {
    id: projectId,
    name,
    assets,
    currentAssetId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const existingProjects = await getSavedProjects();
  const updatedProjects = { ...existingProjects, [projectId]: project };
  
  await idbSet(PROJECTS_KEY, updatedProjects);
  return projectId;
}

export async function loadProject(projectId: string): Promise<ProjectData | null> {
  const projects = await getSavedProjects();
  return projects[projectId] || null;
}

export async function getSavedProjects(): Promise<Record<string, ProjectData>> {
  try {
    const projects = await idbGet(PROJECTS_KEY);
    return projects || {};
  } catch (error) {
    console.error('Failed to get saved projects:', error);
    return {};
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  const projects = await getSavedProjects();
  delete projects[projectId];
  await idbSet(PROJECTS_KEY, projects);
}

export async function saveCurrentSession(assets: Record<string, Asset>, currentAssetId?: string): Promise<void> {
  const session = {
    assets,
    currentAssetId,
    updatedAt: Date.now(),
  };
  await idbSet(CURRENT_SESSION_KEY, session);
}

export async function loadCurrentSession(): Promise<{ assets: Record<string, Asset>; currentAssetId?: string } | null> {
  try {
    const session = await idbGet(CURRENT_SESSION_KEY);
    return session || null;
  } catch (error) {
    console.error('Failed to load current session:', error);
    return null;
  }
}

export async function exportProjectAsJSON(projectId: string): Promise<string> {
  const project = await loadProject(projectId);
  if (!project) throw new Error('Project not found');
  
  return JSON.stringify(project, null, 2);
}

export async function importProjectFromJSON(jsonData: string): Promise<string> {
  const project: ProjectData = JSON.parse(jsonData);
  
  // Generate new ID to avoid conflicts
  const newProjectId = crypto.randomUUID();
  project.id = newProjectId;
  project.updatedAt = Date.now();
  
  const existingProjects = await getSavedProjects();
  const updatedProjects = { ...existingProjects, [newProjectId]: project };
  
  await idbSet(PROJECTS_KEY, updatedProjects);
  return newProjectId;
}