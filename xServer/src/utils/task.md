# Real-Time Doubt Resolution System — Task Tracker

## Phase 1: Bug Fixes
- [x] Fix server.js — http.createServer + initSocket
- [x] Fix student.service.js — mongoose import, catch block, findStudentId
- [x] Fix students.controller.js — slug variable, .js extension

## Phase 2: New Model
- [x] Create doubtSession.model.js with TTL (4 hours after session end)

## Phase 3: Socket Helper Updates
- [x] Add chat room functions (create, destroy, join, message relay)
- [x] Add mentor offer + student select events
- [x] Add session timer with auto-expire

## Phase 4: Repository Layer
- [x] Update IStudent.contract.js with new abstract methods
- [x] Update mongo.student.repository.js with DoubtSession CRUD

## Phase 5: Service Layer
- [x] Update student.service.js — create doubt, select mentor, end session
- [x] Update mentor.service.js — reply to doubt with real offer

## Phase 6: Controller & Routes
- [x] Update students.controller.js with new handlers
- [x] Update mentor.controller.js with replyToDoubt handler
- [x] Create student.routes.js
- [x] Update mentor.routes.js
- [x] Register routes in app.js

## Phase 7: Verification & Testing
- [x] Run assessment E2E pass test (`node e2e-pass-test.js`)
- [x] Create doubt session E2E test (`node e2e-doubt-session-test.js`)
- [x] Run doubt session E2E test and verify database state transitions
