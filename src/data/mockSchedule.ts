import type { Course, TimeSlot } from '../types/schedule'

export const weekDays = [
  { day: 1, label: '\u5468\u4e00' },
  { day: 2, label: '\u5468\u4e8c' },
  { day: 3, label: '\u5468\u4e09' },
  { day: 4, label: '\u5468\u56db' },
  { day: 5, label: '\u5468\u4e94' },
  { day: 6, label: '\u5468\u516d' },
  { day: 7, label: '\u5468\u65e5' },
]

export const timeSlots: TimeSlot[] = [
  { id: 'slot-1', startTime: '08:00', endTime: '09:50' },
  { id: 'slot-2', startTime: '10:10', endTime: '12:00' },
  { id: 'slot-3', startTime: '13:30', endTime: '15:20' },
  { id: 'slot-4', startTime: '15:40', endTime: '17:30' },
  { id: 'slot-5', startTime: '18:30', endTime: '20:20' },
]

export const courses: Course[] = [
  { id: 'a-1', owner: 'alice', title: '\u9ad8\u7b49\u6570\u5b66', classroom: '\u6559\u5b66\u697c301', day: 1, startTime: '08:00', endTime: '09:50', weekPattern: 'all', icon: 'book' },
  { id: 'b-1', owner: 'bob', title: '\u7ebf\u6027\u4ee3\u6570', classroom: '\u6559\u5b66\u697c202', day: 1, startTime: '08:00', endTime: '09:50', weekPattern: 'even', icon: 'route' },
  { id: 'a-2', owner: 'alice', title: '\u5927\u5b66\u82f1\u8bed', classroom: '\u6559\u5b66\u697c405', day: 1, startTime: '10:10', endTime: '12:00', weekPattern: 'all', icon: 'language' },
  { id: 'b-2', owner: 'bob', title: '\u8ba1\u7b97\u673a\u5bfc\u8bba', classroom: '\u5b9e\u9a8c\u697c1\u5c42', day: 1, startTime: '10:10', endTime: '12:00', weekPattern: 'all', icon: 'monitor' },
  { id: 'a-3', owner: 'alice', title: '\u7269\u7406\u5b66', classroom: '\u6559\u5b66\u697c201', day: 1, startTime: '13:30', endTime: '15:20', weekPattern: 'odd', icon: 'atom' },
  { id: 'b-3', owner: 'bob', title: '\u7269\u7406\u5b66', classroom: '\u6559\u5b66\u697c201', day: 1, startTime: '13:30', endTime: '15:20', weekPattern: 'odd', icon: 'atom' },
  { id: 'b-4', owner: 'bob', title: '\u7bee\u7403', classroom: '\u4f53\u80b2\u9986', day: 1, startTime: '15:40', endTime: '17:30', weekPattern: 'all', icon: 'circle' },
  { id: 'a-4', owner: 'alice', title: '\u6570\u636e\u7ed3\u6784', classroom: '\u5b9e\u9a8c\u697c2\u5c42', day: 1, startTime: '18:30', endTime: '20:20', weekPattern: 'even', icon: 'code' },
  { id: 'a-5', owner: 'alice', title: '\u79bb\u6563\u6570\u5b66', classroom: '\u6559\u5b66\u697c302', day: 2, startTime: '08:00', endTime: '09:50', weekPattern: 'all', icon: 'chart' },
  { id: 'b-5', owner: 'bob', title: '\u9ad8\u7b49\u6570\u5b66', classroom: '\u6559\u5b66\u697c301', day: 2, startTime: '08:00', endTime: '09:50', weekPattern: 'all', icon: 'book' },
  { id: 'a-6', owner: 'alice', title: '\u5927\u5b66\u7269\u7406\u5b9e\u9a8c', classroom: '\u5b9e\u9a8c\u697c3\u5c42', day: 3, startTime: '08:00', endTime: '09:50', weekPattern: 'all', icon: 'flask' },
  { id: 'b-6', owner: 'bob', title: '\u6982\u7387\u8bba', classroom: '\u6559\u5b66\u697c305', day: 3, startTime: '08:00', endTime: '09:50', weekPattern: 'all', icon: 'chart' },
  { id: 'a-7', owner: 'alice', title: '\u8ba1\u7b97\u673a\u7f51\u7edc', classroom: '\u6559\u5b66\u697c304', day: 3, startTime: '13:30', endTime: '15:20', weekPattern: 'odd', icon: 'globe' },
  { id: 'b-7', owner: 'bob', title: '\u8ba1\u7b97\u673a\u7f51\u7edc', classroom: '\u6559\u5b66\u697c304', day: 3, startTime: '13:30', endTime: '15:20', weekPattern: 'odd', icon: 'globe' },
  { id: 'a-8', owner: 'alice', title: '\u64cd\u4f5c\u7cfb\u7edf', classroom: '\u6559\u5b66\u697c307', day: 5, startTime: '08:00', endTime: '09:50', weekPattern: 'all', icon: 'monitor' },
  { id: 'b-8', owner: 'bob', title: '\u6570\u5b57\u4fe1\u53f7\u5904\u7406', classroom: '\u6559\u5b66\u697c306', day: 5, startTime: '08:00', endTime: '09:50', weekPattern: 'all', icon: 'waves' },
  { id: 'a-9', owner: 'alice', title: '\u5927\u5b66\u751f\u5fc3\u7406\u5065\u5eb7', classroom: '\u901a\u8bc6\u697c103', day: 6, startTime: '10:10', endTime: '12:00', weekPattern: 'all', icon: 'heart' },
  { id: 'b-9', owner: 'bob', title: '\u5927\u5b66\u751f\u5fc3\u7406\u5065\u5eb7', classroom: '\u901a\u8bc6\u697c103', day: 6, startTime: '10:10', endTime: '12:00', weekPattern: 'all', icon: 'heart' },
  { id: 'a-10', owner: 'alice', title: '\u56e2\u961f\u5408\u4f5c\u8bad\u7ec3', classroom: '\u901a\u8bc6\u697c104', day: 6, startTime: '13:30', endTime: '15:20', weekPattern: 'all', icon: 'users' },
  { id: 'b-10', owner: 'bob', title: '\u56e2\u961f\u5408\u4f5c\u8bad\u7ec3', classroom: '\u901a\u8bc6\u697c104', day: 6, startTime: '13:30', endTime: '15:20', weekPattern: 'all', icon: 'users' },
]
