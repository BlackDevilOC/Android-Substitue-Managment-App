import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { IStorage } from "./types";
import type { User, InsertUser, Teacher, Schedule, Absence, TeacherAttendance, InsertTeacherAttendance } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MemoryStore = createMemoryStore(session);

export async function loadData(filename: string) {
  const filePath = path.join(__dirname, '../data', filename);
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return null;
  }
}

export async function saveData(filename: string, data: any) {
  const filePath = path.join(__dirname, '../data', filename);
  try {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving ${filename}:`, error);
    return false;
  }
}

export class Storage implements IStorage {
  private dataPath: string;
  private currentId: number = 1; // Initialize currentId
  private users: User[] = [];
  private teachers: Teacher[] = [];
  private schedules: Schedule[] = [];
  private absences: Absence[] = [];
  private teacherAttendances: TeacherAttendance[] = [];
  private smsHistory: SmsHistory[] = [];


  constructor() {
    // Use local storage for mobile app
    if (typeof window !== 'undefined') {
      this.dataPath = 'localStorage';
    } else {
      this.dataPath = path.join(__dirname, '../data');
    }
    this.ensureDataDirectory();
    this.loadCurrentId();
  }

  private async ensureDataDirectory() {
    if (this.dataPath === 'localStorage') {
      return; // No need to create directory for localStorage
    }
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }

  private async loadCurrentId() {
      try {
          const data = await loadData('currentId.json');
          this.currentId = data || 1;
      } catch (error) {
          this.currentId = 1;
      }
  }

  private async saveCurrentId() {
      await saveData('currentId.json', this.currentId);
  }


  private getFilePath(filename: string): string {
    return path.join(this.dataPath, filename);
  }

  //The following functions are removed as they are now redundant.
  // private async saveData(filename: string, data: any) {}
  // private async loadData(filename: string) {}


  private async loadUsers(): Promise<User[]> {
    try{
      const users = await loadData('users.json');
      return users || [];
    } catch (error) {
      return [];
    }
  }

  private async saveUsers(users: User[]): Promise<void> {
    await saveData('users.json', users);
  }

  private async loadTeachers(): Promise<Teacher[]> {
    return (await loadData('teachers.json')) || [];
  }

  private async saveTeachers(teachers: Teacher[]): Promise<void> {
    await saveData('teachers.json', teachers);
  }

  private async loadSchedules(): Promise<Schedule[]> {
    return (await loadData('schedules.json')) || [];
  }

  private async saveSchedules(schedules: Schedule[]): Promise<void> {
    await saveData('schedules.json', schedules);
  }

  private async loadAbsences(): Promise<Absence[]> {
    return (await loadData('absences.json')) || [];
  }

  private async saveAbsences(absences: Absence[]): Promise<void> {
    await saveData('absences.json', absences);
  }

  private async loadTeacherAttendances(): Promise<TeacherAttendance[]> {
    return (await loadData('teacherAttendances.json')) || [];
  }

  private async saveTeacherAttendances(teacherAttendances: TeacherAttendance[]): Promise<void> {
    await saveData('teacherAttendances.json', teacherAttendances);
  }

  private async loadSmsHistory(): Promise<SmsHistory[]> {
    return (await loadData('smsHistory.json')) || [];
  }

  private async saveSmsHistory(smsHistory: SmsHistory[]): Promise<void> {
    await saveData('smsHistory.json', smsHistory);
  }



  private isTeacherOverloaded(teacherId: number, date: string): boolean {
    const MAX_DAILY_SUBSTITUTIONS = 3;
    const assignments = this.absences.filter(a => a.date === date && a.substituteId === teacherId);
    return assignments.length >= MAX_DAILY_SUBSTITUTIONS;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const users = await this.loadUsers();
    return users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await this.loadUsers();
    return users.find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const users = await this.loadUsers();
    const id = this.currentId++;
    const user: User = { ...insertUser, id, isAdmin: false };
    users.push(user);
    await this.saveUsers(users);
    await this.saveCurrentId();
    return user;
  }

  async updateUserPassword(id: number, password: string): Promise<void> {
    const users = await this.loadUsers();
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex !== -1) {
      users[userIndex].password = password;
      await this.saveUsers(users);
    }
  }

  async updateUsername(id: number, newUsername: string): Promise<boolean> {
    const users = await this.loadUsers();
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex !== -1) {
      users[userIndex].username = newUsername;
      await this.saveUsers(users);
      return true;
    }
    return false;
  }

  // Teacher methods
  async createTeacher(teacher: Omit<Teacher, "id">): Promise<Teacher> {
    const teachers = await this.loadTeachers();
    const id = this.currentId++;
    const newTeacher = { ...teacher, id };
    teachers.push(newTeacher);
    await this.saveTeachers(teachers);
    await this.saveCurrentId();
    return newTeacher;
  }

  async getTeacher(id: number): Promise<Teacher | undefined> {
    const teachers = await this.loadTeachers();
    return teachers.find(teacher => teacher.id === id);
  }

  async getTeachers(): Promise<Teacher[]> {
    return await this.loadTeachers();
  }

  async clearTeachers() {
    await saveData('teachers.json', []);
    console.log('All teachers deleted from database');
  }


  // Schedule methods
  async createSchedule(schedule: Omit<Schedule, "id">): Promise<Schedule> {
    const schedules = await this.loadSchedules();
    const id = this.currentId++;
    const newSchedule = { ...schedule, id };
    schedules.push(newSchedule);
    await this.saveSchedules(schedules);
    await this.saveCurrentId();
    return newSchedule;
  }

  async getSchedulesByDay(day: string): Promise<Schedule[]> {
    const schedules = await this.loadSchedules();
    return schedules.filter(s => s.day === day.toLowerCase());
  }

  // Absence methods
  async createAbsence(absence: Omit<Absence, "id">): Promise<Absence> {
    const absences = await this.loadAbsences();
    const id = this.currentId++;
    const newAbsence = { ...absence, id };
    absences.push(newAbsence);
    await this.saveAbsences(absences);
    await this.saveCurrentId();
    return newAbsence;
  }

  async getAbsences(): Promise<Absence[]> {
    return await this.loadAbsences();
  }

  async assignSubstitute(absenceId: number, substituteId: number): Promise<void> {
    const absences = await this.loadAbsences();
    const absenceIndex = absences.findIndex(a => a.id === absenceId);
    if (absenceIndex !== -1) {
      absences[absenceIndex].substituteId = substituteId;
      await this.saveAbsences(absences);
    }
  }

  // Teacher Attendance methods
  async createTeacherAttendance(attendance: Omit<TeacherAttendance, "id">): Promise<TeacherAttendance> {
    const teacherAttendances = await this.loadTeacherAttendances();
    const id = this.currentId++;
    const newAttendance = { ...attendance, id };
    teacherAttendances.push(newAttendance);
    await this.saveTeacherAttendances(teacherAttendances);
    await this.saveCurrentId();
    return newAttendance;
  }

  async getTeacherAttendanceByDate(date: string): Promise<TeacherAttendance[]> {
    const teacherAttendances = await this.loadTeacherAttendances();
    const dateObj = new Date(date);
    return teacherAttendances.filter(a => a.date.toDateString() === dateObj.toDateString());
  }

  async getTeacherAttendanceBetweenDates(startDate: string, endDate: string): Promise<TeacherAttendance[]> {
    const teacherAttendances = await this.loadTeacherAttendances();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return teacherAttendances.filter(a => a.date >= start && a.date <= end);
  }

  async autoAssignSubstitutes(date: string): Promise<Map<string, string>> {
    await this.loadData();

    const { SubstituteManager } = await import('./substitute-manager.js');
    const manager = new SubstituteManager();

    await manager.loadData();

    const absentTeachers = this.absences
      .filter((absence) => absence.date === date && !absence.substituteId)
      .map((absence) => this.teachers.find(t => t.id === absence.teacherId)?.name || '');

    if (absentTeachers.length === 0) {
      return new Map<string, string>();
    }

    manager.clearAssignments();

    const { assignments, warnings } = await manager.autoAssignSubstitutes(date, absentTeachers);

    const assignmentsMap = new Map<string, string>();

    for (const assignment of assignments) {
      const key = `${assignment.period}-${assignment.className}`;
      assignmentsMap.set(key, assignment.substitute);

      const absentTeacherId = this.teachers.find(t =>
        t.name.toLowerCase() === assignment.originalTeacher.toLowerCase())?.id;

      if (!absentTeacherId) continue;

      const absenceRecord = this.absences.find(
        a => a.teacherId === absentTeacherId && a.date === date
      );

      if (!absenceRecord) continue;

      const substituteId = this.teachers.find(t =>
        t.name.toLowerCase() === assignment.substitute.toLowerCase())?.id;

      if (substituteId) {
        await this.assignSubstitute(absenceRecord.id, substituteId);
      }
    }

    return assignmentsMap;
  }

  private getTeacherPeriod(teacherId: number, date: string): number {
    const schedules = this.schedules.find(s => s.teacherId === teacherId && s.day.toLowerCase() === new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase());
    return schedules?.period || 0;
  }

  async createSmsHistory(sms: Omit<SmsHistory, "id" | "sentAt">): Promise<SmsHistory> {
    const smsHistory = await this.loadSmsHistory();
    const id = this.currentId++;
    const newSms = { ...sms, id, sentAt: new Date() };
    smsHistory.push(newSms);
    await this.saveSmsHistory(smsHistory);
    await this.saveCurrentId();
    return newSms;
  }

  async getSmsHistory(): Promise<SmsHistory[]> {
    return await this.loadSmsHistory();
  }

  private getTeacherClass(teacherId: number, date: string): string {
    const schedules = this.schedules.find(s => s.teacherId === teacherId && s.day.toLowerCase() === new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase());
    return schedules?.className || '';
  }

  async getSubstituteAssignments(date: string): Promise<any[]> {
    await this.loadData();

    const { SubstituteManager } = await import('./substitute-manager.js');
    const manager = new SubstituteManager();

    await manager.loadData();

    const { assignments: managerAssignments } = manager.getSubstituteAssignments();

    if (managerAssignments && managerAssignments.length > 0) {
      return managerAssignments.map(assignment => ({
        period: assignment.period,
        className: assignment.className,
        originalTeacherName: assignment.originalTeacher,
        substituteName: assignment.substitute || "Not assigned",
        substitutePhone: assignment.substitutePhone || null,
      }));
    }

    await this.autoAssignSubstitutes(date);

    const { assignments: newAssignments } = manager.getSubstituteAssignments();

    return (newAssignments || []).map(assignment => ({
      period: assignment.period,
      className: assignment.className,
      originalTeacherName: assignment.originalTeacher,
      substituteName: assignment.substitute || "Not assigned",
      substitutePhone: assignment.substitutePhone || null,
    }));
  }

  async loadData() {
    this.users = await this.loadUsers();
    this.teachers = await this.loadTeachers();
    this.schedules = await this.loadSchedules();
    this.absences = await this.loadAbsences();
    this.teacherAttendances = await this.loadTeacherAttendances();
    this.smsHistory = await this.loadSmsHistory();
    console.log("Data loaded");
  }

  async setDayOverride(day: string | null): Promise<void> {
    //No changes needed
  }

  async getCurrentDay(): Promise<string> {
    //No changes needed
  }

  async clearSchedules(): Promise<void> {
    await saveData('schedules.json', []);
  }
}

export const storage = new Storage();

interface SmsHistory {
  id: number;
  teacherId: number;
  message: string;
  sentAt: Date;
}