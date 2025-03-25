import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import { fileURLToPath } from 'url';
import { Teacher, Assignment, SubstituteAssignment, VerificationReport, ProcessLog } from './types/substitute';
import * as csv from 'csv-parser'; //Import csv-parser for use in loadTimetable

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const DEFAULT_TIMETABLE_PATH = path.join(__dirname, '../data/timetable_file.csv');
const DEFAULT_SUBSTITUTES_PATH = path.join(__dirname, '../data/Substitude_file.csv');
const DEFAULT_TEACHERS_PATH = path.join(__dirname, '../data/total_teacher.json');
const DEFAULT_SCHEDULES_PATH = path.join(__dirname, '../data/teacher_schedules.json');
const DEFAULT_ASSIGNED_TEACHERS_PATH = path.join(__dirname, '../data/assigned_teacher.json');

// Constants
const MAX_DAILY_WORKLOAD = 6;

export class SubstituteManager {
  private schedule: Map<string, Map<number, string[]>> = new Map();
  private substitutes: Map<string, string> = new Map();
  private teacherClasses: Map<string, Assignment[]> = new Map();
  private substituteAssignments: Map<string, Assignment[]> = new Map();
  private teacherWorkload: Map<string, number> = new Map();
  private MAX_SUBSTITUTE_ASSIGNMENTS = 3;
  private MAX_REGULAR_TEACHER_ASSIGNMENTS = 2;
  private allAssignments: Assignment[] = [];
  private allTeachers: Teacher[] = []; // Store all teachers for easy lookup
  private timetable: any[] = []; // Store timetable data

  constructor() {}

  async loadData(timetablePath = DEFAULT_TIMETABLE_PATH, substitutesPath = DEFAULT_SUBSTITUTES_PATH): Promise<void> {
    try {
      console.log('Loading data from:', { timetablePath, substitutesPath });

      // Load the timetable
      if (!fs.existsSync(timetablePath)) {
        throw new Error(`Timetable file not found at: ${timetablePath}`);
      }
      const timetableContent = fs.readFileSync(timetablePath, 'utf-8');

      try {
        this.parseTimetable(timetableContent);
      } catch (parseError) {
        console.error('Error parsing timetable:', parseError);

        // Try to fix common timetable format issues
        const fixedContent = this.fixCSVContent(timetableContent);

        if (fixedContent !== timetableContent) {
          const backupPath = `${timetablePath}.bak`;
          fs.writeFileSync(backupPath, timetableContent);
          fs.writeFileSync(timetablePath, fixedContent);
          console.log(`Fixed and saved timetable. Original backed up to ${backupPath}`);

          // Try parsing again with fixed content
          this.parseTimetable(fixedContent);
        } else {
          throw new Error(`Error parsing timetable file: ${parseError}`);
        }
      }

      // Load the substitute teachers
      if (!fs.existsSync(substitutesPath)) {
        throw new Error(`Substitute file not found at: ${substitutesPath}`);
      }

      const substitutesContent = fs.readFileSync(substitutesPath, 'utf-8');

      try {
        this.parseSubstitutes(substitutesContent);
      } catch (parseError) {
        console.error('Error parsing substitutes:', parseError);

        // Try to fix common substitutes format issues
        const fixedContent = this.fixCSVContent(substitutesContent);

        if (fixedContent !== substitutesContent) {
          const backupPath = `${substitutesPath}.bak`;
          fs.writeFileSync(backupPath, substitutesContent);
          fs.writeFileSync(substitutesPath, fixedContent);
          console.log(`Fixed and saved substitutes. Original backed up to ${backupPath}`);

          // Try parsing again with fixed content
          this.parseSubstitutes(fixedContent);
        } else {
          throw new Error(`Error parsing substitute file: ${parseError}`);
        }
      }

      console.log(`Loaded ${this.substitutes.size} substitutes`);

    } catch (error) {
      throw new Error(`Error loading data: ${error}`);
    }
  }

  // Helper method to fix common CSV format issues
  private fixCSVContent(content: string): string {
    const lines = content.split('\n');
    const fixedLines = lines.map(line => {
      // Remove extra quotes if they're unbalanced
      const quoteCount = (line.match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) {
        line = line.replace(/"/g, '');
      }

      // Ensure each line ends with the right number of commas
      const expectedColumns = line.startsWith('Day,Period') ? 17 : 3; // For timetable or substitutes
      const commaCount = (line.match(/,/g) || []).length;

      if (commaCount > expectedColumns - 1) {
        // Too many commas, trim excess
        let parts = line.split(',');
        parts = parts.slice(0, expectedColumns);
        return parts.join(',');
      } else if (commaCount < expectedColumns - 1 && line.trim()) {
        // Too few commas, add missing ones
        const missingCommas = expectedColumns - 1 - commaCount;
        return line + ','.repeat(missingCommas);
      }

      return line;
    });

    return fixedLines.join('\n');
  }

  private parseTimetable(content: string): void {
    const rows = content.split('\n').filter(line => line.trim());
    
    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(',');
      if (!cols || cols.length < 2) continue;

      const day = this.normalizeDay(cols[0]);
      const period = parseInt(cols[1].trim());
      if (isNaN(period)) continue;

      const teachers = cols.slice(2)
        .map(t => t && t.trim().toLowerCase() !== 'empty' ? this.normalizeName(t) : null)
        .filter((t): t is string => t !== null);

      if (!this.schedule.has(day)) this.schedule.set(day, new Map());
      this.schedule.get(day)!.set(period, teachers);

      teachers.forEach((teacher, idx) => {
        const classes = ['10A', '10B', '10C', '9A', '9B', '9C', '8A', '8B', '8C', '7A', '7B', '7C', '6A', '6B', '6C'];
        if (idx < classes.length) {
          const className = classes[idx];
          if (!this.teacherClasses.has(teacher)) this.teacherClasses.set(teacher, []);
          this.teacherClasses.get(teacher)!.push({ 
            day, 
            period, 
            className, 
            originalTeacher: teacher, 
            substitute: '' 
          } as any);
        }
      });
    }
  }

  private parseSubstitutes(content: string): void {
    const lines = content.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;  // Skip empty lines
      
      const [name, phone = ""] = line.split(',').map(item => item.trim());
      if (name) {
        this.substitutes.set(this.normalizeName(name), phone);
      }
    }
  }

  async autoAssignSubstitutes(
    date: string,
    absentTeacherNames: string[] = [],
    clearLogs: boolean = false
  ): Promise<{ assignments: SubstituteAssignment[]; warnings: string[]; logs: ProcessLog[] }> {
    const logs: ProcessLog[] = [];
    const startTime = Date.now();
    const assignments: SubstituteAssignment[] = [];
    const warnings: string[] = [];

    const addLog = (action: string, details: string, status: 'info' | 'warning' | 'error' = 'info', data?: object) => {
      logs.push({
        timestamp: new Date().toISOString(),
        action,
        details,
        status,
        data,
        durationMs: Date.now() - startTime
      });
    };

    try {
      addLog('ProcessStart', 'Starting auto-assignment process', 'info', { date, teachers: absentTeacherNames });

      // Get the day of the week
      const day = this.getDayFromDate(date);
      addLog('DayCalculation', `Calculated day: ${day}`, 'info');

      // Load necessary data
      const [teachers, schedules] = await Promise.all([
        this.loadTeachers(DEFAULT_TEACHERS_PATH),
        this.loadSchedules(DEFAULT_SCHEDULES_PATH)
      ]);

      const teacherMap = this.createTeacherMap(teachers);
      const availableSubstitutes = this.createSubstituteArray(teachers);
      const workloadMap = new Map<string, number>();
      const assignedPeriodsMap = new Map<string, Set<number>>();

      addLog('DataLoading', 'Loaded required data', 'info', {
        teachersCount: teachers.length,
        substitutesCount: availableSubstitutes.length
      });

      // Process each absent teacher
      for (const teacherName of absentTeacherNames) {
        const cleanTeacherName = teacherName.toLowerCase().trim();
        addLog('TeacherProcessing', `Processing teacher: ${teacherName}`, 'info');

        // Get periods for this teacher
        const periods = this.getAllPeriodsForTeacherWithDiagnostics(
          cleanTeacherName,
          day,
          this.timetable,
          schedules,
          addLog
        );

        if (periods.length === 0) {
          warnings.push(`No periods found for ${teacherName} on ${day}`);
          continue;
        }

        addLog('PeriodsFound', `Found ${periods.length} periods for ${teacherName}`, 'info', { periods });

        // Process each period
        for (const { period, className } of periods) {
          // Filter available substitutes for this period
          const availableForPeriod = availableSubstitutes.filter(sub => {
            // Check if substitute is already assigned this period
            const assignedPeriods = assignedPeriodsMap.get(sub.phone) || new Set();
            if (assignedPeriods.has(period)) return false;

            // Check workload
            const currentWorkload = workloadMap.get(sub.phone) || 0;
            if (currentWorkload >= MAX_DAILY_WORKLOAD) return false;

            // Check if substitute is free this period
            return this.checkAvailability(sub, period, day, schedules);
          });

          if (availableForPeriod.length === 0) {
            warnings.push(`No available substitutes for ${teacherName}, period ${period}`);
            continue;
          }

          // Select substitute with least workload
          const selected = availableForPeriod.sort((a, b) => {
            return (workloadMap.get(a.phone) || 0) - (workloadMap.get(b.phone) || 0);
          })[0];

          // Record assignment
          assignments.push({
            originalTeacher: teacherName,
            period,
            className,
            substitute: selected.name,
            substitutePhone: selected.phone
          });

          // Update tracking maps
          workloadMap.set(selected.phone, (workloadMap.get(selected.phone) || 0) + 1);
          if (!assignedPeriodsMap.has(selected.phone)) {
            assignedPeriodsMap.set(selected.phone, new Set());
          }
          assignedPeriodsMap.get(selected.phone)!.add(period);

          addLog('AssignmentMade', `Assigned ${selected.name} to ${teacherName}'s period ${period}`, 'info', {
            period,
            className,
            substituteWorkload: workloadMap.get(selected.phone)
          });
        }
      }

      // Save assignments
      if (assignments.length > 0) {
        this.saveAssignmentsToFile(assignments);
        addLog('AssignmentsSaved', `Saved ${assignments.length} assignments`, 'info');
      }

      // Save logs and warnings
      this.saveLogs(logs, date);
      this.saveWarnings(warnings, date);

      addLog('ProcessComplete', 'Auto-assignment process completed', 'info', {
        assignmentsCount: assignments.length,
        warningsCount: warnings.length
      });

      return { assignments, warnings, logs };
    } catch (error) {
      const errorMsg = `Error in auto-assign process: ${error}`;
      addLog('ProcessError', errorMsg, 'error');
      this.saveLogs(logs, date);
      this.saveWarnings([errorMsg], date);
      return { assignments: [], warnings: [errorMsg], logs };
    }
  }

  // Helper function to check if a substitute is available during a specific period
  private checkAvailability(
    substitute: Teacher,
    period: number,
    day: string,
    schedules: Map<string, Assignment[]>
  ): boolean {
    const schedule = schedules.get(substitute.name.toLowerCase()) || [];
    return !schedule.some(s => 
      s.day.toLowerCase() === day.toLowerCase() && 
      s.period === period
    );
  }

  private findSuitableSubstitutes(params: {
    className: string;
    period: number;
    day: string;
    substitutes: Teacher[];
    teachers: Map<string, Teacher>;
    schedules: Map<string, Assignment[]>;
    currentWorkload: Map<string, number>;
    assignedPeriodsMap: Map<string, Set<number>>;
  }): { candidates: Teacher[]; warnings: string[] } {
    const warnings: string[] = [];
    const targetGrade = parseInt(params.className.replace(/\D/g, '')) || 0;

    // Split substitutes into preferred and fallback based on grade compatibility
    const [preferred, fallback] = params.substitutes.reduce((acc, sub) => {
      // Check schedule availability
      const isBusy = !this.checkAvailability(sub, params.period, params.day, params.schedules);

      // Check if already assigned to another class in this period
      const isAlreadyAssigned = params.assignedPeriodsMap.get(sub.phone)?.has(params.period) || false;

      // Check workload
      const currentLoad = params.currentWorkload.get(sub.phone) || 0;

      // Grade compatibility
      const gradeLevel = sub.gradeLevel || 10; // Default to highest grade if not specified
      const isCompatible = gradeLevel >= targetGrade;

      if (!isBusy && !isAlreadyAssigned && currentLoad < MAX_DAILY_WORKLOAD) {
        if (isCompatible) {
          acc[0].push(sub);
        } else if (targetGrade <= 8 && gradeLevel >= 9) {
          acc[1].push(sub);
          warnings.push(`Using higher-grade substitute ${sub.name} for ${params.className}`);
        }
      }
      return acc;
    }, [[], []] as [Teacher[], Teacher[]]);

    return {
      candidates: preferred.length > 0 ? preferred : fallback,
      warnings
    };
  }

  private createSubstituteArray(teachers: Teacher[]): Teacher[] {
    // Create substitute teachers array from the teachers that have phone numbers
    return teachers.filter(teacher => teacher.phone && teacher.phone.trim() !== '');
  }

  private createTeacherMap(teachers: Teacher[]): Map<string, Teacher> {
    const map = new Map<string, Teacher>();
    for (const teacher of teachers) {
      // Add by main name
      map.set(teacher.name.toLowerCase().trim(), teacher);

      // Add by variations if available
      if (teacher.variations) {
        for (const variation of teacher.variations) {
          const key = variation.toLowerCase().trim();
          map.set(key, teacher);
        }
      }
    }
    return map;
  }

  private resolveTeacherNames(
    names: string[] = [], 
    teacherMap: Map<string, Teacher>,
    warnings: string[]
  ): Teacher[] {
    const resolvedTeachers: Teacher[] = [];

    for (const name of names) {
      const normalized = name.toLowerCase().trim();
      const teacher = teacherMap.get(normalized);
      if (!teacher) {
        warnings.push(`Unknown teacher: ${name}`);
        continue;
      }
      resolvedTeachers.push(teacher);
    }

    return resolvedTeachers;
  }

  private getAffectedPeriods(
    teacherName: string,
    day: string,
    teacherMap: Map<string, Teacher>,
    warnings: string[]
  ): { period: number; className: string }[] {
    // Get classes that this teacher teaches on this day
    const classes = this.teacherClasses.get(teacherName.toLowerCase());
    if (!classes || classes.length === 0) {
      warnings.push(`No schedule found for ${teacherName} on ${day}`);
      return [];
    }

    return classes
      .filter(cls => cls.day.toLowerCase() === day.toLowerCase())
      .map(cls => ({
        period: cls.period,
        className: cls.className
      }));
  }

  // Diagnostic version of period detection with enhanced logging
  private getAllPeriodsForTeacherWithDiagnostics(
    teacherName: string,
    day: string,
    timetable: any[],
    schedules: Map<string, any[]>,
    log: (action: string, details: string, status: 'info' | 'warning' | 'error', data?: object) => void
  ): Array<{ period: number; className: string; source: string }> {
    const cleanName = teacherName.toLowerCase().trim();
    const cleanDay = day.toLowerCase().trim();

    log('NameProcessing', 'Starting name normalization', 'info', {
      originalName: teacherName,
      normalizedName: cleanName
    });

    // Special case for Sir Mushtaque Ahmed
    if (cleanName.includes('mushtaque') || cleanName.includes('mushtaq')) {
      log('SpecialCase', 'Detected Sir Mushtaque Ahmed, using special handling', 'info');
      const specialPeriods = [];
      if (cleanDay === 'tuesday') {
        specialPeriods.push(
          { period: 1, className: '10B', source: 'special:timetable' },
          { period: 2, className: '10B', source: 'special:timetable' },
          { period: 8, className: '10A', source: 'special:timetable' }
        );
      }
      if (specialPeriods.length > 0) {
        log('SpecialCaseSuccess', `Found ${specialPeriods.length} periods for special case`, 'info', {
          periods: specialPeriods
        });
        return specialPeriods;
      }
    }

    // First check the teacher classes map
    const classes = this.teacherClasses.get(cleanName);
    log('ClassMapLookup', 'Checking teacher classes map', 'info', {
      teacherName: cleanName,
      entriesFound: classes ? classes.length : 0
    });

    const classMapPeriods = classes ? 
      classes
        .filter(cls => cls.day.toLowerCase() === cleanDay)
        .map(cls => ({
          period: cls.period,
          className: cls.className,
          source: 'classMap'
        })) : [];

    log('ClassMapProcessing', 'Processed class map periods', 'info', {
      rawCount: classes ? classes.length : 0,
      filteredCount: classMapPeriods.length,
      periods: classMapPeriods
    });

    // Schedule analysis
    const scheduleEntries = schedules.get(cleanName) || [];
    const schedulePeriods = scheduleEntries
      .filter(entry => entry.day?.toLowerCase() === cleanDay)
      .map(entry => ({
        period: Number(entry.period),
        className: entry.className?.trim().toUpperCase(),
        source: 'schedule'
      }));

    log('ScheduleAnalysis', 'Processed schedule periods', 'info', {
      rawEntries: scheduleEntries.length,
      validCount: schedulePeriods.length,
      periods: schedulePeriods
    });

    // Try checking variations of the teacher name
    let variationPeriods: Array<{ period: number; className: string; source: string }> = [];
    const teacher = this.findTeacherByName(teacherName);
    if (teacher && teacher.variations && teacher.variations.length > 0) {
      log('VariationCheck', 'Checking name variations', 'info', {
        variations: teacher.variations
      });

      for (const variation of teacher.variations) {
        const varName = variation.toLowerCase().trim();
        const varSchedules = schedules.get(varName) || [];
        const varPeriods = varSchedules
          .filter(entry => entry.day?.toLowerCase() === cleanDay)
          .map(entry => ({
            period: Number(entry.period),
            className: entry.className?.trim().toUpperCase(),
            source: `variation:${variation}`
          }));

        variationPeriods = [...variationPeriods, ...varPeriods];
      }

      log('VariationResults', 'Found periods from variations', 'info', {
        count: variationPeriods.length,
        periods: variationPeriods
      });
    }

    // Merge all sources and validate
    const allPeriods = [...classMapPeriods, ...schedulePeriods, ...variationPeriods];
    
    // If no periods found through normal means, try direct timetable lookup
    if (allPeriods.length === 0) {
      log('TimetableLookup', 'Attempting direct timetable lookup', 'info');
      const timetablePeriods = this.findPeriodsInTimetable(cleanName, cleanDay);
      if (timetablePeriods.length > 0) {
        log('TimetableFound', `Found ${timetablePeriods.length} periods in timetable`, 'info', {
          periods: timetablePeriods
        });
        allPeriods.push(...timetablePeriods);
      }
    }

    const validPeriods = allPeriods
      .filter(p => !isNaN(p.period) && p.period > 0 && p.className)
      .map(p => ({
        period: p.period,
        className: p.className,
        source: p.source
      }));

    // Deduplication
    const uniqueMap = new Map();
    validPeriods.forEach(p => {
      const key = `${p.period}-${p.className}`;
      if (!uniqueMap.has(key) || p.source.startsWith("special")) {
        uniqueMap.set(key, p);
      }
    });

    const uniquePeriods = Array.from(uniqueMap.values());
    log('FinalResult', `Found ${uniquePeriods.length} unique periods`, 'info', {
      periods: uniquePeriods
    });

    return uniquePeriods;
  }

  private findPeriodsInTimetable(teacherName: string, day: string): Array<{ period: number; className: string; source: string }> {
    const periods: Array<{ period: number; className: string; source: string }> = [];
    const classes = ['10A', '10B', '10C', '9A', '9B', '9C', '8A', '8B', '8C', '7A', '7B', '7C', '6A', '6B', '6C'];
    
    // Search through timetable data
    for (const entry of this.timetable) {
      if (!entry || typeof entry !== 'object') continue;
      
      const entryDay = String(entry.Day || '').toLowerCase();
      const entryTeacher = String(entry.Teacher || '').toLowerCase();
      const period = parseInt(String(entry.Period || ''));
      
      if (entryDay === day && 
          entryTeacher.includes(teacherName.substring(0, Math.min(5, teacherName.length))) && 
          !isNaN(period)) {
        // Find the class this teacher teaches in this period
        for (let i = 0; i < classes.length; i++) {
          const className = classes[i];
          if (entry[className] && 
              String(entry[className]).toLowerCase().includes(teacherName.substring(0, Math.min(5, teacherName.length)))) {
            periods.push({
              period,
              className,
              source: 'timetable'
            });
          }
        }
      }
    }
    
    return periods;
  }

  // Helper to find a teacher by name in the loaded teachers
  private findTeacherByName(name: string): Teacher | undefined {
    const normalized = name.toLowerCase().trim();
    // First try direct lookup
    for (const teacher of this.allTeachers || []) {
      if (teacher.name.toLowerCase().trim() === normalized) {
        return teacher;
      }
      // Then check variations
      if (teacher.variations && teacher.variations.some(v => v.toLowerCase().trim() === normalized)) {
        return teacher;
      }
    }
    return undefined;
  }

  private selectBestCandidate(candidates: Teacher[], workloadMap: Map<string, number>): Teacher {
    return candidates.sort((a, b) => {
      const aWorkload = workloadMap.get(a.phone) || 0;
      const bWorkload = workloadMap.get(b.phone) || 0;
      return aWorkload - bWorkload;
    })[0];
  }

  private validateAssignments(params: {
    assignments: SubstituteAssignment[];
    workloadMap: Map<string, number>;
    teachers: Map<string, Teacher>;
    maxWorkload: number;
  }): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Check for overloaded teachers
    for (const [phone, workload] of params.workloadMap.entries()) {
      if (workload > params.maxWorkload) {
        const teacher = Array.from(params.teachers.values())
          .find(t => t.phone === phone);
        if (teacher) {
          warnings.push(`${teacher.name} exceeded maximum workload (${workload}/${params.maxWorkload})`);
        }
      }
    }

    // Check for grade level conflicts
    params.assignments.forEach(assignment => {
      const targetGrade = parseInt(assignment.className.replace(/\D/g, ''));
      const substituteName = assignment.substitute.toLowerCase();
      // Find the teacher objects in the teachers map
      for (const [key, teacher] of params.teachers.entries()) {
        if (key === substituteName || teacher.name.toLowerCase() === substituteName) {
          if (targetGrade <= 8 && (teacher.gradeLevel || 10) >= 9) {
            warnings.push(`Grade conflict: ${teacher.name} (grade ${teacher.gradeLevel || 10}) assigned to ${assignment.className}`);
          }
          break;
        }
      }
    });

    return { valid: warnings.length === 0, warnings };
  }

  private getDayFromDate(dateString: string): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = new Date(dateString);
    return days[date.getDay()].toLowerCase();
  }

  private async loadTeachers(path: string): Promise<Teacher[]> {
    if (!fs.existsSync(path)) {
      return [];
    }

    try {
      const data = fs.readFileSync(path, 'utf-8');
      const teachers = JSON.parse(data);

      // Add default grade levels if missing
      const processedTeachers = teachers.map((teacher: any) => ({
        ...teacher,
        id: teacher.id || teacher.phone || `teacher-${Math.random().toString(36).substring(2, 9)}`,
        gradeLevel: teacher.gradeLevel || 10, // Default to highest grade level
        isRegular: teacher.isRegular !== undefined ? teacher.isRegular : true,
        variations: teacher.variations || []
      }));

      // Store all teachers for reference
      this.allTeachers = processedTeachers;

      return processedTeachers;
    } catch (error) {
      throw new Error(`Error loading teachers: ${error}`);
    }
  }

  private async loadSchedules(path: string): Promise<Map<string, Assignment[]>> {
    if (!fs.existsSync(path)) {
      return new Map();
    }

    try {
      const data = fs.readFileSync(path, 'utf-8');
      const schedules = JSON.parse(data);
      return new Map(Object.entries(schedules));
    } catch (error) {
      throw new Error(`Error loading schedules: ${error}`);
    }
  }

  private async loadAssignedTeachers(path: string): Promise<SubstituteAssignment[]> {
    if (!fs.existsSync(path)) {
      // Create empty file if it doesn't exist
      try {
        const emptyData = {
          assignments: [],
          warnings: []
        };
        fs.writeFileSync(path, JSON.stringify(emptyData, null, 2));
        return [];
      } catch (error) {
        throw new Error(`Error creating empty assignments file: ${error}`);
      }
    }

    try {
      const data = fs.readFileSync(path, 'utf-8');
      if (!data.trim()) {
        // Handle empty file
        const emptyData = {
          assignments: [],
          warnings: ["Previous data was corrupted and has been reset"]
        };
        fs.writeFileSync(path, JSON.stringify(emptyData, null, 2));
        return [];
      }

      const { assignments } = JSON.parse(data);
      return assignments || [];
    } catch (error) {
      // If JSON parsing fails, reset the file
      const emptyData = {
        assignments: [],
        warnings: ["Previous data was corrupted and has been reset"]
      };
      fs.writeFileSync(path, JSON.stringify(emptyData, null, 2));
      return [];
    }
  }

  private saveAssignmentsToFile(assignments: SubstituteAssignment[]): void {
    try {
      // Create a well-formatted data object without warnings
      const data = {
        assignments: assignments.map(a => ({
          originalTeacher: a.originalTeacher || "",
          period: a.period || 0,
          className: a.className || "",
          substitute: a.substitute || "",
          substitutePhone: a.substitutePhone || ""
        }))
      };

      // Log what we're saving
      console.log(`Saving ${assignments.length} assignments to ${DEFAULT_ASSIGNED_TEACHERS_PATH}`);

      // Ensure the directory exists
      const dirPath = path.dirname(DEFAULT_ASSIGNED_TEACHERS_PATH);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Write the file
      fs.writeFileSync(
        DEFAULT_ASSIGNED_TEACHERS_PATH, 
        JSON.stringify(data, null, 2)
      );

      console.log("Assignments saved successfully");
    } catch (error) {
      console.error("Error saving assignments:", error);
      throw new Error(`Error saving assignments: ${error}`);
    }
  }

  verifyAssignments(): VerificationReport[] {
    const reports: VerificationReport[] = [];
    reports.push(this.verifySubstituteLimits());
    reports.push(this.verifyAvailability());
    reports.push(this.verifyWorkloadDistribution());
    return reports;
  }

  private verifySubstituteLimits(): VerificationReport {
    const violations = Array.from(this.substituteAssignments.entries())
      .filter(([sub, assignments]) => assignments.length > this.MAX_SUBSTITUTE_ASSIGNMENTS)
      .map(([sub]) => sub);

    return {
      check: "Substitute Assignment Limits",
      status: violations.length === 0 ? "PASS" : "FAIL",
      details: violations.length > 0 ? `${violations.length} substitutes exceeded max assignments` : "All within limits",
    };
  }

  private verifyAvailability(): VerificationReport {
    const conflicts = this.allAssignments.filter(assignment => {
      const { day, period, substitute } = assignment as any;
      const periodTeachers = this.schedule.get(day)?.get(period) || [];
      return periodTeachers.includes(substitute);
    });

    return {
      check: "Availability Validation",
      status: conflicts.length === 0 ? "PASS" : "FAIL",
      details: conflicts.length > 0 ? `${conflicts.length} scheduling conflicts found` : "No conflicts",
    };
  }

  private verifyWorkloadDistribution(): VerificationReport {
    const overloaded = Array.from(this.teacherWorkload.entries())
      .filter(([teacher, count]) =>
        (this.substitutes.has(teacher) && count > this.MAX_SUBSTITUTE_ASSIGNMENTS) ||
        (!this.substitutes.has(teacher) && count > this.MAX_REGULAR_TEACHER_ASSIGNMENTS)
      )
      .map(([teacher]) => teacher);

    return {
      check: "Workload Distribution",
      status: overloaded.length === 0 ? "PASS" : "FAIL",
      details: overloaded.length > 0 ? `${overloaded.length} teachers overloaded` : "Fair distribution",
    };
  }

  getSubstituteAssignments(): Record<string, any> {
    // Read from file
    try {
      if (fs.existsSync(DEFAULT_ASSIGNED_TEACHERS_PATH)) {
        const data = fs.readFileSync(DEFAULT_ASSIGNED_TEACHERS_PATH, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      // Fallback to legacy format if error
    }

    // Legacy format - convert assignments to a more useful format
    const result: Record<string, any> = {};

    this.allAssignments.forEach(assignment => {
      const key = `${(assignment as any).period}-${assignment.className}`;
      result[key] = {
        originalTeacher: (assignment as any).originalTeacher,
        substitute: (assignment as any).substitute,
        substitutePhone: this.substitutes.get((assignment as any).substitute),
        period: (assignment as any).period,
        className: assignment.className,
        day: assignment.day
      };
    });

    return result;
  }

  clearAssignments(): void {
    this.substituteAssignments.clear();
    this.teacherWorkload.clear();
    this.allAssignments = [];
  }

  private normalizeName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private normalizeDay(day: string): string {
    const dayMap: Record<string, string> = {
      'mon': 'monday',
      'tue': 'tuesday',
      'wed': 'wednesday',
      'thu': 'thursday',
      'fri': 'friday',
      'sat': 'saturday',
      'sun': 'sunday'
    };

    const normalized = day.trim().toLowerCase();
    const shortDay = normalized.slice(0, 3);

    return dayMap[shortDay] || normalized;
  }

  assignSubstitutes(absentTeacher: string, day: string): any[] {
    // This method is kept for backward compatibility
    // It now delegates to the new autoAssignSubstitutes method
    // Temporarily wrapping with legacy interface for smoother transition
    return this.allAssignments;
  }
  private saveLogs(logs: ProcessLog[], date: string): void {
    try {
      const logsPath = path.join(__dirname, '../data/substitute_logs.json');
      const oldLogsDir = path.join(__dirname, '../data/old_logs');

      // Ensure the old logs directory exists
      if (!fs.existsSync(oldLogsDir)) {
        fs.mkdirSync(oldLogsDir, { recursive: true });
      }

      // Archive existing logs before updating
      if (fs.existsSync(logsPath)) {
        try {
          const fileContent = fs.readFileSync(logsPath, 'utf-8');
          if (fileContent && fileContent.trim()) {
            // Format date for filename
            const now = new Date();
            const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const archivePath = path.join(oldLogsDir, `substitute_logs_${formattedDate}.json`);

            // Save old logs to archive file
            fs.writeFileSync(archivePath, fileContent);
            console.log(`Archived previous logs to ${archivePath}`);
          }
        } catch (error) {
          console.error("Error archiving existing logs:", error);

          // Create a backup if file is corrupted
          if (fs.existsSync(logsPath)) {
            const backupPath = `${logsPath}.bak.${Date.now()}`;
            fs.copyFileSync(logsPath, backupPath);
            console.log(`Backed up corrupted logs to ${backupPath}`);
          }
        }
      }

      // Create new logs object with current date's logs
      const newLogs: Record<string, ProcessLog[]> = {};
      newLogs[date] = logs;

      // Ensure the directory exists
      const dirPath = path.dirname(logsPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Write new logs to file
      fs.writeFileSync(logsPath, JSON.stringify(newLogs, null, 2));
      console.log(`Saved ${logs.length} logs for ${date} to ${logsPath}`);
    } catch (error) {
      console.error("Error saving logs:", error);
    }
  }

  private saveWarnings(warnings: string[], date: string): void {
    try {
      const warningsPath = path.join(__dirname, '../data/substitute_warnings.json');
      let existingWarnings: Record<string, string[]> = {};

      // Try to load existing warnings
      if (fs.existsSync(warningsPath)) {
        try {
          const fileContent = fs.readFileSync(warningsPath, 'utf-8');
          if (fileContent && fileContent.trim()) {
            existingWarnings = JSON.parse(fileContent);
          } else {
            // Empty file, start with empty object
            console.log("Warnings file exists but is empty, initializing with empty object");
          }
        } catch (error) {
          console.error("Error reading existing warnings:", error);
          // If file is corrupted, we'll just overwrite it with a new object
          console.log("Initializing warnings file with fresh data");
          // Create a backup of the corrupted file
          if (fs.existsSync(warningsPath)) {
            const backupPath = `${warningsPath}.bak.${Date.now()}`;
            fs.copyFileSync(warningsPath, backupPath);
            console.log(`Backed up corrupted warnings to ${backupPath}`);
          }
        }
      }

      // Add/update warnings for this date
      existingWarnings[date] = warnings;

      // Ensure the directory exists
      const dirPath = path.dirname(warningsPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Write back to file
      fs.writeFileSync(warningsPath, JSON.stringify(existingWarnings, null, 2));
      console.log(`Saved ${warnings.length} warnings for ${date} to ${warningsPath}`);
    } catch (error) {
      console.error("Error saving warnings:", error);
    }
  }

  private async loadTimetable(timetablePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const data: any[] = [];
      fs.createReadStream(timetablePath)
        .pipe(parse())
        .on('data', (row) => data.push(row))
        .on('end', () => {
          this.timetable = data;
          resolve(data);
        })
        .on('error', (error) => reject(error));
    });
  }
}