-- EUL4_BATCH_PACKAGE260506220828 (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE EUL4_BATCH_PACKAGE260506220828 AS
   PROCEDURE RUN;
END EUL4_BATCH_PACKAGE260506220828;

-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY EUL4_BATCH_PACKAGE260506220828 AS
PROCEDURE RUN IS
   eulSchemaName    VARCHAR2(128) := 'SIID_TESTES';
   timeStamp        VARCHAR2(12) := '260506220828';
   batchReportId    NUMBER(22) := 268581;
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
                                     268590,
                                     1,
                                     'BRN1 NUMBER, BRVC1 VARCHAR2(20), BRVC2 VARCHAR2(40), BRVC3 VARCHAR2(200), BRVC4 VARCHAR2(600), BRVC5 VARCHAR2(4), BRVC6 VARCHAR2(60), BRVC7 VARCHAR2(160), BRVC8 VARCHAR2(2000), BRVC9 VARCHAR2(20), BRVC10 VARCHAR2(3), BRVC11 VARCHAR2(3), BRVC12 VARCHAR2(4000), BRVC13 VARCHAR2(4000), BRVC14 VARCHAR2(2), BRVC15 VARCHAR2(160), BRD1 DATE, BRD2 DATE, BRVC16 VARCHAR2(4000), BRD3 DATE, BRD4 DATE, BRD5 DATE, BRVC17 VARCHAR2(175), BRD6 DATE, BRVC18 VARCHAR2(19), BRVC19 VARCHAR2(80), BRVC20 VARCHAR2(4), BRVC21 VARCHAR2(5), BRVC22 VARCHAR2(175), BRN2 NUMBER, BRN3 NUMBER, BRVC23 VARCHAR2(20), BRVC24 VARCHAR2(175), BRVC25 VARCHAR2(80), BRVC26 VARCHAR2(40), BRVC27 VARCHAR2(80), BRN4 NUMBER, BRN5 NUMBER, BRN6 NUMBER, BRN7 NUMBER, BRN8 NUMBER, BRN9 NUMBER, BRN10 NUMBER, BRN11 NUMBER, BRN12 NUMBER, BRN13 NUMBER, BRN14 NUMBER, BRN15 NUMBER, BRN16 NUMBER, BRN17 NUMBER, BRN18 NUMBER, BRN19 NUMBER, BRN20 NUMBER, BRN21 NUMBER, BRN22 NUMBER, BRN23 NUMBER, BRN24 NUMBER, BRN25 NUMBER, BRN26 NUMBER, BRN27 NUMBER, BRN28 NUMBER, BRN29 NUMBER, BRN30 NUMBER, BRN31 NUMBER, BRN32 NUMBER, BRN33 NUMBER, BRN34 NUMBER, BRN35 NUMBER, BRN36 NUMBER, BRN37 NUMBER, BRN38 NUMBER, BRN39 NUMBER',
                                     'batch_rec.E153532, batch_rec.E153537, batch_rec.E153538, batch_rec.E153540, batch_rec.E153543, batch_rec.E153546, batch_rec.E153549, batch_rec.E153551, batch_rec.E153552, batch_rec.E153553, batch_rec.E153554, batch_rec.E153555, batch_rec.E153557, batch_rec.E153559, batch_rec.E153560, batch_rec.E153561, batch_rec.E153563, batch_rec.E153564, batch_rec.E153567, batch_rec.E153596, batch_rec.E153597, batch_rec.E153598, batch_rec.E153600, batch_rec.E153601, batch_rec.E153602, batch_rec.E153605, batch_rec.E153606, batch_rec.E154195, batch_rec.E154196, batch_rec.E178455, batch_rec.E178456, batch_rec.E210934, batch_rec.E257651, batch_rec.E257652, batch_rec.E267833, batch_rec.E267834, batch_rec.E_371, batch_rec.E_368, batch_rec.E_365, batch_rec.E_362, batch_rec.E_326, batch_rec.E_323, batch_rec.E_317, batch_rec.E_314, batch_rec.E_311, batch_rec.E_302, batch_rec.E_299, batch_rec.E_277, batch_rec.E_274, batch_rec.E_267, batch_rec.E_253, batch_rec.E_250, batch_rec.E_241, batch_rec.E153562, batch_rec.E153565, batch_rec.E153569, batch_rec.E153570, batch_rec.E153571, batch_rec.E153575, batch_rec.E153576, batch_rec.E153578, batch_rec.E153579, batch_rec.E153580, batch_rec.E153589, batch_rec.E153590, batch_rec.E153591, batch_rec.E153592, batch_rec.E153593, batch_rec.E153607, batch_rec.E178457, batch_rec.E178458, batch_rec.E178459',
                                     batchCommitSize,
                                     rowFetchLimit,
                                     0);

      SIID_TESTES.EUL4_BATCH_USER.ExecuteQuery(eulSchemaName,
                                     timeStamp,
                                     batchReportRunId,
                                     batchReportRunNo,
                                     userName,
                                     268655,
                                     2,
                                     'BRN1 NUMBER, BRVC1 VARCHAR2(20), BRVC2 VARCHAR2(40), BRVC3 VARCHAR2(200), BRVC4 VARCHAR2(600), BRVC5 VARCHAR2(4), BRVC6 VARCHAR2(60), BRVC7 VARCHAR2(160), BRVC8 VARCHAR2(2000), BRVC9 VARCHAR2(20), BRVC10 VARCHAR2(3), BRVC11 VARCHAR2(3), BRVC12 VARCHAR2(4000), BRVC13 VARCHAR2(4000), BRVC14 VARCHAR2(2), BRVC15 VARCHAR2(160), BRD1 DATE, BRD2 DATE, BRVC16 VARCHAR2(4000), BRD3 DATE, BRD4 DATE, BRD5 DATE, BRVC17 VARCHAR2(175), BRD6 DATE, BRVC18 VARCHAR2(19), BRVC19 VARCHAR2(80), BRVC20 VARCHAR2(4), BRVC21 VARCHAR2(5), BRVC22 VARCHAR2(175), BRN2 NUMBER, BRN3 NUMBER, BRVC23 VARCHAR2(20), BRVC24 VARCHAR2(175), BRVC25 VARCHAR2(80), BRVC26 VARCHAR2(40), BRVC27 VARCHAR2(80), BRN4 NUMBER, BRN5 NUMBER, BRN6 NUMBER, BRN7 NUMBER, BRN8 NUMBER, BRN9 NUMBER, BRN10 NUMBER, BRN11 NUMBER, BRN12 NUMBER, BRN13 NUMBER, BRN14 NUMBER, BRN15 NUMBER, BRN16 NUMBER, BRN17 NUMBER, BRN18 NUMBER, BRN19 NUMBER, BRN20 NUMBER, BRN21 NUMBER, BRN22 NUMBER, BRN23 NUMBER, BRN24 NUMBER, BRN25 NUMBER, BRN26 NUMBER, BRN27 NUMBER, BRN28 NUMBER, BRN29 NUMBER, BRN30 NUMBER, BRN31 NUMBER, BRN32 NUMBER, BRN33 NUMBER, BRN34 NUMBER, BRN35 NUMBER, BRN36 NUMBER, BRN37 NUMBER, BRN38 NUMBER, BRN39 NUMBER',
                                     'batch_rec.E153532, batch_rec.E153537, batch_rec.E153538, batch_rec.E153540, batch_rec.E153543, batch_rec.E153546, batch_rec.E153549, batch_rec.E153551, batch_rec.E153552, batch_rec.E153553, batch_rec.E153554, batch_rec.E153555, batch_rec.E153557, batch_rec.E153559, batch_rec.E153560, batch_rec.E153561, batch_rec.E153563, batch_rec.E153564, batch_rec.E153567, batch_rec.E153596, batch_rec.E153597, batch_rec.E153598, batch_rec.E153600, batch_rec.E153601, batch_rec.E153602, batch_rec.E153605, batch_rec.E153606, batch_rec.E154195, batch_rec.E154196, batch_rec.E178455, batch_rec.E178456, batch_rec.E210934, batch_rec.E257651, batch_rec.E257652, batch_rec.E267833, batch_rec.E267834, batch_rec.E_371, batch_rec.E_368, batch_rec.E_365, batch_rec.E_362, batch_rec.E_326, batch_rec.E_323, batch_rec.E_317, batch_rec.E_314, batch_rec.E_311, batch_rec.E_302, batch_rec.E_299, batch_rec.E_277, batch_rec.E_274, batch_rec.E_267, batch_rec.E_253, batch_rec.E_250, batch_rec.E_241, batch_rec.E153562, batch_rec.E153565, batch_rec.E153569, batch_rec.E153570, batch_rec.E153571, batch_rec.E153575, batch_rec.E153576, batch_rec.E153578, batch_rec.E153579, batch_rec.E153580, batch_rec.E153589, batch_rec.E153590, batch_rec.E153591, batch_rec.E153592, batch_rec.E153593, batch_rec.E153607, batch_rec.E178457, batch_rec.E178458, batch_rec.E178459',
                                     batchCommitSize,
                                     rowFetchLimit,
                                     0);

      SIID_TESTES.EUL4_BATCH_USER.ExecuteQuery(eulSchemaName,
                                     timeStamp,
                                     batchReportRunId,
                                     batchReportRunNo,
                                     userName,
                                     268720,
                                     3,
                                     'BRN1 NUMBER, BRN2 NUMBER, BRVC1 VARCHAR2(20), BRVC2 VARCHAR2(3), BRVC3 VARCHAR2(60), BRD1 DATE, BRD2 DATE, BRD3 DATE, BRVC4 VARCHAR2(40), BRD4 DATE, BRVC5 VARCHAR2(160), BRVC6 VARCHAR2(3), BRVC7 VARCHAR2(4000), BRVC8 VARCHAR2(19), BRVC9 VARCHAR2(40), BRVC10 VARCHAR2(160), BRVC11 VARCHAR2(4000), BRVC12 VARCHAR2(20), BRVC13 VARCHAR2(80), BRVC14 VARCHAR2(4), BRVC15 VARCHAR2(175), BRVC16 VARCHAR2(20), BRN3 NUMBER, BRN4 NUMBER, BRN5 NUMBER, BRN6 NUMBER, BRN7 NUMBER, BRN8 NUMBER, BRN9 NUMBER, BRN10 NUMBER, BRN11 NUMBER, BRVC17 VARCHAR2(2000), BRN12 NUMBER, BRN13 NUMBER, BRN14 NUMBER, BRN15 NUMBER, BRN16 NUMBER, BRN17 NUMBER, BRN18 NUMBER',
                                     'batch_rec.E154244, batch_rec.E154245, batch_rec.E154248, batch_rec.E154250, batch_rec.E154252, batch_rec.E154253, batch_rec.E154254, batch_rec.E154255, batch_rec.E154258, batch_rec.E154259, batch_rec.E154260, batch_rec.E154261, batch_rec.E154262, batch_rec.E154263, batch_rec.E154291, batch_rec.E154292, batch_rec.E154294, batch_rec.E154296, batch_rec.E154297, batch_rec.E154298, batch_rec.E154299, batch_rec.E210936, batch_rec.E_359, batch_rec.E_356, batch_rec.E_353, batch_rec.E_349, batch_rec.E_345, batch_rec.E_341, batch_rec.E_338, batch_rec.E_335, batch_rec.E_329, batch_rec.E_285, batch_rec.E154266, batch_rec.E154267, batch_rec.E154272, batch_rec.E154277, batch_rec.E154279, batch_rec.E154289, batch_rec.E174439',
                                     batchCommitSize,
                                     rowFetchLimit,
                                     0);

      SIID_TESTES.EUL4_BATCH_USER.ExecuteQuery(eulSchemaName,
                                     timeStamp,
                                     batchReportRunId,
                                     batchReportRunNo,
                                     userName,
                                     268758,
                                     4,
                                     'BRN1 NUMBER, BRVC1 VARCHAR2(60), BRD1 DATE, BRVC2 VARCHAR2(160), BRD2 DATE, BRD3 DATE, BRVC3 VARCHAR2(3), BRVC4 VARCHAR2(15), BRVC5 VARCHAR2(4000), BRVC6 VARCHAR2(4), BRVC7 VARCHAR2(3), BRVC8 VARCHAR2(20), BRN2 NUMBER, BRN3 NUMBER, BRVC9 VARCHAR2(2000), BRVC10 VARCHAR2(2000), BRVC11 VARCHAR2(2000), BRN4 NUMBER, BRN5 NUMBER, BRN6 NUMBER, BRN7 NUMBER, BRN8 NUMBER, BRN9 NUMBER, BRN10 NUMBER',
                                     'batch_rec.E154453, batch_rec.E154456, batch_rec.E154457, batch_rec.E154460, batch_rec.E154461, batch_rec.E154462, batch_rec.E154467, batch_rec.E154471, batch_rec.E154474, batch_rec.E154475, batch_rec.E174049, batch_rec.E210938, batch_rec.E_296, batch_rec.E_293, batch_rec.E_291, batch_rec.E_289, batch_rec.E_287, batch_rec.E_238, batch_rec.E_235, batch_rec.E154468, batch_rec.E154469, batch_rec.E154473, batch_rec.E158573, batch_rec.E158574',
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
END EUL4_BATCH_PACKAGE260506220828;
