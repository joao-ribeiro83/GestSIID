-- EUL4_BATCH_PACKAGE101214125358 (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE EUL4_BATCH_PACKAGE101214125358 AS
   PROCEDURE RUN;
END EUL4_BATCH_PACKAGE101214125358;

-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY EUL4_BATCH_PACKAGE101214125358 AS
PROCEDURE RUN IS
   eulSchemaName    VARCHAR2(128) := 'SIID_TESTES';
   timeStamp        VARCHAR2(12) := '101214125358';
   batchReportId    NUMBER(22) := 118802;
   batchReportRunNo NUMBER(22);
   batchReportRunId NUMBER(22);
   userName         VARCHAR2(129);
   rowFetchLimit    NUMBER(22);
   batchCommitSize  NUMBER(22);
   startDate        DATE := SYSDATE;
   error            BOOLEAN := FALSE;
BEGIN

   BEGIN
      IF (SIID_TESTES.EUL4_BATCH_USER.IsReportValid(eulSchemaName,
                                          batchReportId) = FALSE) THEN
           RETURN;
      END IF;
      SIID_TESTES.EUL4_BATCH_USER.GetUserLimits(eulSchemaName,
                                      batchReportId,
                                      userName,
                                      batchCommitSize,
                                      rowFetchLimit);
      SIID_TESTES.EUL4_BATCH_USER.SetExpiredRuns(eulSchemaName,
                                       userName);
      SIID_TESTES.EUL4_BATCH_USER.SetBatchReportRunInProgress(eulSchemaName,
                                                    batchReportId,
                                                    batchReportRunNo,
                                                    batchReportRunId);

      SIID_TESTES.EUL4_BATCH_USER.ExecuteQuery(eulSchemaName,
                                     timeStamp,
                                     batchReportRunId,
                                     batchReportRunNo,
                                     userName,
                                     118810,
                                     1,
                                     'BRD1 DATE, BRN1 NUMBER, BRVC1 VARCHAR2(4000), BRN2 NUMBER, BRVC2 VARCHAR2(4000), BRVC3 VARCHAR2(4000), BRVC4 VARCHAR2(4000), BRN3 NUMBER, BRN4 NUMBER, BRN5 NUMBER, BRVC5 VARCHAR2(3), BRVC6 VARCHAR2(18), BRVC7 VARCHAR2(10), BRVC8 VARCHAR2(19), BRVC9 VARCHAR2(80), BRD2 DATE, BRD3 DATE, BRD4 DATE, BRVC10 VARCHAR2(4000), BRD5 DATE, BRD6 DATE, BRD7 DATE, BRVC11 VARCHAR2(4000), BRVC12 VARCHAR2(40), BRVC13 VARCHAR2(4000), BRVC14 VARCHAR2(40), BRVC15 VARCHAR2(40), BRVC16 VARCHAR2(4000), BRVC17 VARCHAR2(4000), BRVC18 VARCHAR2(3), BRVC19 VARCHAR2(4000), BRVC20 VARCHAR2(4000), BRVC21 VARCHAR2(4000), BRVC22 VARCHAR2(4000), BRVC23 VARCHAR2(4000), BRVC24 VARCHAR2(40), BRVC25 VARCHAR2(40), BRVC26 VARCHAR2(20), BRVC27 VARCHAR2(160), BRVC28 VARCHAR2(200), BRVC29 VARCHAR2(5), BRVC30 VARCHAR2(215), BRVC31 VARCHAR2(15), BRVC32 VARCHAR2(160), BRD8 DATE, BRD9 DATE, BRVC33 VARCHAR2(40), BRVC34 VARCHAR2(40), BRVC35 VARCHAR2(40), BRVC36 VARCHAR2(4000), BRVC37 VARCHAR2(40), BRVC38 VARCHAR2(40), BRVC39 VARCHAR2(40), BRVC40 VARCHAR2(4), BRN6 NUMBER, BRN7 NUMBER, BRN8 NUMBER, BRN9 NUMBER, BRN10 NUMBER, BRN11 NUMBER, BRN12 NUMBER, BRN13 NUMBER, BRN14 NUMBER, BRN15 NUMBER, BRN16 NUMBER, BRN17 NUMBER, BRN18 NUMBER, BRN19 NUMBER, BRN20 NUMBER, BRN21 NUMBER, BRN22 NUMBER, BRN23 NUMBER, BRN24 NUMBER, BRN25 NUMBER, BRN26 NUMBER, BRN27 NUMBER, BRN28 NUMBER, BRN29 NUMBER, BRN30 NUMBER, BRN31 NUMBER, BRN32 NUMBER, BRN33 NUMBER, BRN34 NUMBER, BRN35 NUMBER, BRN36 NUMBER, BRN37 NUMBER, BRN38 NUMBER, BRN39 NUMBER, BRN40 NUMBER, BRN41 NUMBER, BRN42 NUMBER, BRN43 NUMBER, BRN44 NUMBER, BRN45 NUMBER, BRN46 NUMBER, BRN47 NUMBER, BRN48 NUMBER, BRN49 NUMBER, BRN50 NUMBER, BRN51 NUMBER, BRN52 NUMBER, BRN53 NUMBER, BRN54 NUMBER, BRN55 NUMBER, BRN56 NUMBER, BRN57 NUMBER, BRN58 NUMBER, BRN59 NUMBER',
                                     'batch_rec.E_248, batch_rec.E_237, batch_rec.E_231, batch_rec.E_227, batch_rec.E_214, batch_rec.E_211, batch_rec.E_208, batch_rec.E114914, batch_rec.E114915, batch_rec.E114916, batch_rec.E114917, batch_rec.E114920, batch_rec.E114921, batch_rec.E114922, batch_rec.E114924, batch_rec.E114928, batch_rec.E114929, batch_rec.E114931, batch_rec.E114933, batch_rec.E114934, batch_rec.E114935, batch_rec.E114936, batch_rec.E114939, batch_rec.E114940, batch_rec.E114941, batch_rec.E114942, batch_rec.E114943, batch_rec.E114945, batch_rec.E114947, batch_rec.E114948, batch_rec.E114960, batch_rec.E114962, batch_rec.E114972, batch_rec.E114974, batch_rec.E114976, batch_rec.E114977, batch_rec.E114978, batch_rec.E114991, batch_rec.E114992, batch_rec.E114995, batch_rec.E114996, batch_rec.E114997, batch_rec.E114998, batch_rec.E114999, batch_rec.E115011, batch_rec.E115016, batch_rec.E115021, batch_rec.E115023, batch_rec.E115025, batch_rec.E115026, batch_rec.E115027, batch_rec.E115028, batch_rec.E116229, batch_rec.E116230, batch_rec.E_255, batch_rec.E_244, batch_rec.E_240, batch_rec.E_234, batch_rec.E_223, batch_rec.E_217, batch_rec.E114949, batch_rec.E114950, batch_rec.E114951, batch_rec.E114952, batch_rec.E114953, batch_rec.E114954, batch_rec.E114955, batch_rec.E114956, batch_rec.E114957, batch_rec.E114958, batch_rec.E114963, batch_rec.E114964, batch_rec.E114965, batch_rec.E114966, batch_rec.E114967, batch_rec.E114968, batch_rec.E114969, batch_rec.E114970, batch_rec.E114979, batch_rec.E114980, batch_rec.E114981, batch_rec.E114982, batch_rec.E114983, batch_rec.E114984, batch_rec.E114985, batch_rec.E114986, batch_rec.E114987, batch_rec.E114988, batch_rec.E114989, batch_rec.E114990, batch_rec.E114993, batch_rec.E114994, batch_rec.E115000, batch_rec.E115001, batch_rec.E115002, batch_rec.E115003, batch_rec.E115005, batch_rec.E115006, batch_rec.E115007, batch_rec.E115008, batch_rec.E115009, batch_rec.E115010, batch_rec.E115012, batch_rec.E115013, batch_rec.E115014, batch_rec.E115015, batch_rec.E115019, batch_rec.E115020',
                                     batchCommitSize,
                                     rowFetchLimit,
                                     0);

   EXCEPTION
      WHEN OTHERS THEN
         error := TRUE;
   END;
   SIID_TESTES.EUL4_BATCH_USER.ScheduleRun(eulSchemaName,
                                 timeStamp,
                                 batchReportId,
                                 batchReportRunId,
                                 batchReportRunNo,
                                 error,
                                 startDate);
END RUN;
END EUL4_BATCH_PACKAGE101214125358;
