# Hexagonal CDD Enforcement Specification (EARS Format)

> **Generation**: 87.X3  
> **Date**: 2025-12-29  
> **Phase**: INTERLOCK (I) - Contract Definition  
> **Format**: Amazon EARS (Easy Approach to Requirements Specification)  
> **Validation**: Sequential Thinking + Tavily Grounded

---

## 📋 EARS Requirement Patterns

| Pattern | Template |
|---------|----------|
| **Ubiquitous** | The [system] shall [action] |
| **Event-Driven** | When [trigger], the [system] shall [action] |
| **State-Driven** | While [state], the [system] shall [action] |
| **Unwanted** | If [condition], then the [system] shall [action] |
| **Optional** | Where [feature], the [system] shall [action] |

---

## 🔷 PORT DEFINITIONS (Hexagonal Boundaries)

### REQ-PORT-001: Sensor Port Contract
**Type**: Ubiquitous  
**Requirement**: The SensorPort interface shall define a `sense()` method that accepts a VideoFrame and returns a Promise of SensorFrame validated by Zod schema.

### REQ-PORT-002: Smoother Port Contract  
**Type**: Ubiquitous  
**Requirement**: The SmootherPort interface shall define a `smooth()` method that accepts a SensorFrame and returns a SmoothedFrame with position, velocity, and prediction fields.

### REQ-PORT-003: FSM Port Contract
**Type**: Ubiquitous  
**Requirement**: The FSMPort interface shall define a `process()` method that accepts a SmoothedFrame and returns an FSMAction specifying pointer event type and coordinates.

### REQ-PORT-004: Emitter Port Contract
**Type**: Ubiquitous  
**Requirement**: The EmitterPort interface shall define an `emit()` method that accepts an FSMAction and returns a W3C PointerEvent.

### REQ-PORT-005: Adapter Port Contract
**Type**: Ubiquitous  
**Requirement**: The AdapterPort interface shall define an `inject()` method that accepts a PointerEvent and dispatches it to the target.

---

## 🔷 ZOD SCHEMA ENFORCEMENT (Contract-Driven Design)

### REQ-ZOD-001: Schema Definition
**Type**: Ubiquitous  
**Requirement**: The system shall define all port input/output types as Zod schemas with explicit field validation.

### REQ-ZOD-002: Parse Not Validate
**Type**: Ubiquitous  
**Requirement**: The system shall use `schema.parse()` (throws on error) instead of `schema.safeParse()` (returns result object) at all port boundaries.

### REQ-ZOD-003: Type Inference
**Type**: Ubiquitous  
**Requirement**: The system shall derive TypeScript types from Zod schemas using `z.infer<typeof Schema>` to ensure compile-time and runtime alignment.

### REQ-ZOD-004: No Any Types
**Type**: Unwanted  
**Requirement**: If the codebase contains `as any` or `@ts-ignore` annotations, then the CI pipeline shall reject the commit.

---

## 🔷 HIVE/8 PHASE ENFORCEMENT

### REQ-HIVE-001: I-Phase Contract Definition
**Type**: State-Driven  
**Requirement**: While in INTERLOCK phase (hive="I"), the system shall only emit signals for contract definition and failing test creation (TDD RED).

### REQ-HIVE-002: V-Phase Validation
**Type**: Event-Driven  
**Requirement**: When entering VALIDATE phase (hive="V"), the system shall execute all Zod schema validations and property-based tests before allowing state transition.

### REQ-HIVE-003: Pyre Praetorian Gate
**Type**: Event-Driven  
**Requirement**: When any port receives invalid data, the Pyre Praetorian (Port 5) shall emit a QUARANTINE signal and halt pipeline execution.

### REQ-HIVE-004: No Bypass
**Type**: Unwanted  
**Requirement**: If validation fails at any gate, then the system shall NOT continue execution and shall NOT allow manual override.

---

## 🔷 RUNTIME ENFORCEMENT

### REQ-RUN-001: Gate Function
**Type**: Ubiquitous  
**Requirement**: The system shall implement a `pyreGate<T>(schema, data, source)` function that validates data and throws `PyreViolationError` on failure.

### REQ-RUN-002: No Catch Blocks
**Type**: Unwanted  
**Requirement**: If a catch block swallows `PyreViolationError`, then the CI pipeline shall reject the commit via grep pattern matching.

### REQ-RUN-003: Quarantine Logging
**Type**: Event-Driven  
**Requirement**: When `pyreGate()` rejects data, the system shall append a signal to `obsidianblackboard.jsonl` with `type: "error"` and `hive: "V"`.

---

## 🔷 CI/CD ENFORCEMENT

### REQ-CI-001: Lint Gate
**Type**: Event-Driven  
**Requirement**: When a pull request is opened, the CI shall run `biome check` and reject if any errors are found.

### REQ-CI-002: Type Gate
**Type**: Event-Driven  
**Requirement**: When a pull request is opened, the CI shall run `tsc --noEmit` and reject if any type errors are found.

### REQ-CI-003: Test Gate
**Type**: Event-Driven  
**Requirement**: When a pull request is opened, the CI shall run `vitest run` and reject if any tests fail.

### REQ-CI-004: Escape Hatch Detection
**Type**: Event-Driven  
**Requirement**: When a pull request is opened, the CI shall grep for forbidden patterns (`as any`, `@ts-ignore`, `catch.*{}`) and reject if found.

### REQ-CI-005: Coverage Gate
**Type**: Unwanted  
**Requirement**: If test coverage falls below 80%, then the CI pipeline shall reject the commit.

---

## 🔷 ADAPTER IMPLEMENTATION

### REQ-ADP-001: Interface Compliance
**Type**: Ubiquitous  
**Requirement**: Each adapter implementation shall implement the corresponding Port interface and pass all port contract tests.

### REQ-ADP-002: Coordinate Transform
**Type**: Ubiquitous  
**Requirement**: Each adapter shall implement `transformCoordinates(x, y)` to convert normalized (0-1) coordinates to target-specific coordinates.

### REQ-ADP-003: Bounds Query
**Type**: Ubiquitous  
**Requirement**: Each adapter shall implement `getBounds()` to return the target's width and height for coordinate transformation.

---

## 🔷 PROPERTY-BASED TESTING

### REQ-PBT-001: Fast-Check Integration
**Type**: Ubiquitous  
**Requirement**: The system shall use fast-check for property-based testing with minimum 100 iterations per property.

### REQ-PBT-002: Schema Roundtrip
**Type**: Ubiquitous  
**Requirement**: For each Zod schema, the system shall test that `parse(generate(schema))` succeeds for all generated values.

### REQ-PBT-003: Coordinate Bounds
**Type**: Ubiquitous  
**Requirement**: The system shall test that all position values remain in [0, 1] range after any pipeline transformation.

---

## 📊 VALIDATION EVIDENCE (Tavily Grounded)

### Hexagonal Architecture
- **Source**: Qualcomm Hexagon DSP paper (MICRO 2014)
- **Finding**: "hand, gesture, and face recognition" explicitly listed as use cases
- **URL**: https://pages.cs.wisc.edu/~danav/pubs/qcom/hexagon_micro2014_v6.pdf

### Zod for CDD
- **Source**: Multiple industry blogs, tRPC integration
- **Finding**: "API Boundaries: Validating incoming requests and outgoing responses"
- **URL**: https://iamshadi.medium.com/how-zod-changed-typescript-validation-forever

### AWS Prescriptive Guidance
- **Source**: AWS Documentation
- **Finding**: "Multiple types of clients can use the same domain logic" - validates pluggable adapters
- **URL**: https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/hexagonal-architecture.html

---

## 📋 TRACEABILITY MATRIX

| Requirement | HIVE Phase | Port | Test File |
|-------------|------------|------|-----------|
| REQ-PORT-001 | I | 1 | `sensor.port.test.ts` |
| REQ-PORT-002 | I | 1 | `smoother.port.test.ts` |
| REQ-PORT-003 | I | 1 | `fsm.port.test.ts` |
| REQ-PORT-004 | I | 1 | `emitter.port.test.ts` |
| REQ-PORT-005 | I | 1 | `adapter.port.test.ts` |
| REQ-ZOD-* | I | 6 | `schemas.test.ts` |
| REQ-HIVE-* | V | 5 | `pyre.gate.test.ts` |
| REQ-RUN-* | V | 5 | `pyre.gate.test.ts` |
| REQ-CI-* | V | 5 | `.github/workflows/enforce.yml` |
| REQ-ADP-* | V | 2 | `adapters/*.test.ts` |
| REQ-PBT-* | E | 4 | `properties/*.test.ts` |

---

## 📝 Blackboard Signal

```json
{"ts":"2025-12-29T23:00:00Z","mark":1.0,"pull":"downstream","msg":"INTERLOCK: EARS spec created - Hexagonal CDD with 25 requirements, Tavily grounded","type":"event","hive":"I","gen":87,"port":1}
```

---

*The interface IS the contract. The adapter implements it. The gate validates it.*  
*Gen87.X3 INTERLOCK Phase | 2025-12-29*
