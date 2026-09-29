-- EUL4_BATCH_PACKAGE250409110802 (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE EUL4_BATCH_PACKAGE250409110802 AS
   PROCEDURE RUN;
END EUL4_BATCH_PACKAGE250409110802;

-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY EUL4_BATCH_PACKAGE250409110802 AS
PROCEDURE RUN IS
   eulSchemaName    VARCHAR2(128) := 'SIID_TESTES';
   timeStamp        VARCHAR2(12) := '250409110802';
   batchReportId    NUMBER(22) := 264639;
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
                                     264644,
                                     1,
                                     'BRN1 NUMBER, BRN2 NUMBER, BRN3 NUMBER, BRVC1 VARCHAR2(2), BRN4 NUMBER, BRVC2 VARCHAR2(15), BRVC3 VARCHAR2(20), BRVC4 VARCHAR2(160), BRVC5 VARCHAR2(240), BRVC6 VARCHAR2(40), BRVC7 VARCHAR2(51), BRVC8 VARCHAR2(40), BRVC9 VARCHAR2(30), BRVC10 VARCHAR2(80), BRD1 DATE, BRD2 DATE',
                                     'batch_rec.E225365, batch_rec.E225366, batch_rec.E225367, batch_rec.E225368, batch_rec.E225369, batch_rec.E225371, batch_rec.E225372, batch_rec.E225373, batch_rec.E225374, batch_rec.E225375, batch_rec.E225376, batch_rec.E225377, batch_rec.E225378, batch_rec.E225379, batch_rec.E256334, batch_rec.E256335',
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
END EUL4_BATCH_PACKAGE250409110802;
