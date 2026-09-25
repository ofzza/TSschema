export default {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'urn:cornerstone:schema:schema',
  title: 'schema',
  $comment: 'Definition bundle. Exported types: ScalarRegister. Reference one as #/$defs/<name>.',
  $defs: {
    AssessmentKind: {
      type: 'integer',
      $comment:
        'Cornerstone.Fixtures.Schema.Enums.AssessmentKind (System.Int32). System.Text.Json writes the numeric value here; as a dictionary key the same type is written as the member name instead.',
      oneOf: [
        {
          const: 0,
          title: 'Quiz',
        },
        {
          const: 1,
          title: 'MidtermExam',
        },
        {
          const: 2,
          title: 'FinalExam',
        },
        {
          const: 3,
          title: 'Essay',
        },
        {
          const: 4,
          title: 'LabReport',
        },
        {
          const: 5,
          title: 'Practical',
        },
        {
          const: 6,
          title: 'OralDefence',
        },
        {
          const: 7,
          title: 'GroupProject',
        },
      ],
    },
    ScalarRegister: {
      type: 'object',
      properties: {
        answeredByItem: {
          type: 'object',
          additionalProperties: {
            type: 'boolean',
          },
        },
        curveByItem: {
          type: 'object',
          additionalProperties: {
            type: 'integer',
            minimum: -128,
            maximum: 127,
          },
        },
        rawScoreByItem: {
          type: 'object',
          additionalProperties: {
            type: 'integer',
            minimum: 0,
            maximum: 255,
          },
        },
        seatByItem: {
          type: 'object',
          additionalProperties: {
            type: 'integer',
            minimum: -32768,
            maximum: 32767,
          },
        },
        attemptsByItem: {
          type: 'object',
          additionalProperties: {
            type: 'integer',
            minimum: 0,
            maximum: 65535,
          },
        },
        pointsByItem: {
          type: 'object',
          additionalProperties: {
            type: 'integer',
            minimum: -2147483648,
            maximum: 2147483647,
          },
        },
        sequenceByItem: {
          type: 'object',
          additionalProperties: {
            type: 'integer',
            minimum: 0,
            maximum: 4294967295,
          },
        },
        elapsedTicksByItem: {
          type: 'object',
          additionalProperties: {
            type: 'integer',
            $comment:
              'System.Int64. Bounds are omitted: they are not exactly representable in IEEE-754, and values beyond 2^53 lose precision in readers that parse JSON numbers as doubles.',
          },
        },
        checksumByItem: {
          type: 'object',
          additionalProperties: {
            type: 'integer',
            minimum: 0,
            $comment: 'System.UInt64. The upper bound is omitted: it is not exactly representable in IEEE-754.',
          },
        },
        percentileByItem: {
          type: 'object',
          additionalProperties: {
            type: 'number',
          },
        },
        scaledScoreByItem: {
          type: 'object',
          additionalProperties: {
            type: 'number',
          },
        },
        weightByItem: {
          type: 'object',
          additionalProperties: {
            type: 'number',
            $comment:
              'System.Decimal. Written as an unquoted JSON number with its scale preserved; a reader backed by an IEEE-754 double cannot hold it exactly.',
          },
        },
        letterGradeByItem: {
          type: 'object',
          additionalProperties: {
            type: 'string',
            minLength: 1,
            maxLength: 1,
          },
        },
        remarkByItem: {
          type: 'object',
          additionalProperties: {
            type: 'string',
          },
        },
        responseIdByItem: {
          type: 'object',
          additionalProperties: {
            type: 'string',
            format: 'uuid',
          },
        },
        markedOnByItem: {
          type: 'object',
          additionalProperties: {
            type: 'string',
            format: 'date',
          },
        },
        openedAtByItem: {
          type: 'object',
          additionalProperties: {
            type: 'string',
            pattern: '^([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(\\.\\d{1,7})?$',
            $comment:
              'System.TimeOnly. System.Text.Json writes hh:mm:ss[.fffffff] with no UTC offset, so the JSON Schema "time" format (RFC 3339 full-time) does not hold.',
          },
        },
        durationByItem: {
          type: 'object',
          additionalProperties: {
            type: 'string',
            pattern: '^-?(\\d+\\.)?\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,7})?$',
            $comment: 'System.TimeSpan. System.Text.Json writes [-][d.]hh:mm:ss[.fffffff], not an ISO-8601 duration, so the "duration" format does not hold.',
          },
        },
        recordedAtUtcByItem: {
          type: 'object',
          additionalProperties: {
            type: 'string',
            format: 'date-time',
            $comment:
              'System.DateTime. The offset suffix is present only when DateTimeKind is Utc or Local; a DateTimeKind.Unspecified value is written without one and would not satisfy "date-time".',
          },
        },
        savedAtByItem: {
          type: 'object',
          additionalProperties: {
            type: 'string',
            format: 'date-time',
          },
        },
        remarkByItemNumber: {
          type: 'object',
          propertyNames: {
            type: 'string',
            pattern: '^-?(0|[1-9]\\d*)$',
          },
          additionalProperties: {
            type: 'string',
          },
        },
        scoreByResponseId: {
          type: 'object',
          propertyNames: {
            type: 'string',
            format: 'uuid',
          },
          additionalProperties: {
            type: 'number',
          },
        },
        weightByAssessmentKind: {
          type: 'object',
          $comment:
            "Keyed by Cornerstone.Fixtures.Schema.Enums.AssessmentKind. System.Text.Json writes an enum dictionary key as the member name even under the default numeric converter, so this differs from the enum's value form.",
          propertyNames: {
            type: 'string',
            enum: ['Quiz', 'MidtermExam', 'FinalExam', 'Essay', 'LabReport', 'Practical', 'OralDefence', 'GroupProject'],
          },
          additionalProperties: {
            type: 'number',
            $comment:
              'System.Decimal. Written as an unquoted JSON number with its scale preserved; a reader backed by an IEEE-754 double cannot hold it exactly.',
          },
        },
        attendanceByDate: {
          type: 'object',
          propertyNames: {
            type: 'string',
            format: 'date',
          },
          additionalProperties: {
            type: 'integer',
            minimum: 0,
            maximum: 65535,
          },
        },
      },
      required: [
        'answeredByItem',
        'curveByItem',
        'rawScoreByItem',
        'seatByItem',
        'attemptsByItem',
        'pointsByItem',
        'sequenceByItem',
        'elapsedTicksByItem',
        'checksumByItem',
        'percentileByItem',
        'scaledScoreByItem',
        'weightByItem',
        'letterGradeByItem',
        'remarkByItem',
        'responseIdByItem',
        'markedOnByItem',
        'openedAtByItem',
        'durationByItem',
        'recordedAtUtcByItem',
        'savedAtByItem',
        'remarkByItemNumber',
        'scoreByResponseId',
        'weightByAssessmentKind',
        'attendanceByDate',
      ],
    },
  },
} as const;
