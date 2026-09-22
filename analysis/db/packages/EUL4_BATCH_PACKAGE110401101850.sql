-- EUL4_BATCH_PACKAGE110401101850 (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE EUL4_BATCH_PACKAGE110401101850 AS
   PROCEDURE RUN;
END EUL4_BATCH_PACKAGE110401101850;

-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY EUL4_BATCH_PACKAGE110401101850 AS
PROCEDURE RUN IS
   eulSchemaName    VARCHAR2(128) := 'SIID_TESTES';
   timeStamp        VARCHAR2(12) := '110401101850';
   batchReportId    NUMBER(22) := 121905;
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
                                     121909,
                                     1,
                                     'BRD1 DATE, BRVC1 VARCHAR2(4), BRD2 DATE, BRD3 DATE, BRVC2 VARCHAR2(160), BRVC3 VARCHAR2(3), BRD4 DATE, BRVC4 VARCHAR2(4000), BRN1 NUMBER, BRN2 NUMBER, BRN3 NUMBER, BRN4 NUMBER, BRN5 NUMBER, BRN6 NUMBER, BRN7 NUMBER, BRN8 NUMBER, BRN9 NUMBER',
                                     'batch_rec.E_112, batch_rec.E110645, batch_rec.E110714, batch_rec.E110719, batch_rec.E110880, batch_rec.E110912, batch_rec.E110932, batch_rec.E110955, batch_rec.E_134, batch_rec.E_131, batch_rec.E_126, batch_rec.E_107, batch_rec.E110866, batch_rec.E110927, batch_rec.E110937, batch_rec.E110962, batch_rec.E110966',
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
END EUL4_BATCH_PACKAGE110401101850;
