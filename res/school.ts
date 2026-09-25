export default {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'urn:cornerstone:schema:school',
  title: 'school',
  $comment: 'Definition bundle. Exported types: School. Reference one as #/$defs/<name>.',
  $defs: {
    Address: {
      type: 'object',
      properties: {
        street: {
          type: 'string',
        },
        city: {
          type: 'string',
        },
        postalCode: {
          type: 'string',
        },
        countryCode: {
          type: 'string',
        },
        latitude: {
          type: 'number',
        },
        longitude: {
          type: 'number',
        },
      },
      required: ['street', 'city', 'postalCode', 'countryCode', 'latitude', 'longitude'],
    },
    Assessment: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
        },
        kind: {
          $ref: '#/$defs/AssessmentKind',
        },
        title: {
          type: 'string',
        },
        weight: {
          type: 'number',
          $comment:
            'System.Decimal. Written as an unquoted JSON number with its scale preserved; a reader backed by an IEEE-754 double cannot hold it exactly.',
        },
        maximumMarks: {
          type: 'integer',
          minimum: 0,
          maximum: 65535,
        },
        dueAt: {
          type: 'string',
          format: 'date-time',
        },
        isOpenBook: {
          type: 'boolean',
        },
        class: {
          anyOf: [
            {
              $ref: '#/$defs/Class',
            },
            {
              type: 'null',
            },
          ],
        },
        record: {
          $ref: '#/$defs/AssessmentRecord',
        },
      },
      required: ['id', 'kind', 'title', 'weight', 'maximumMarks', 'dueAt', 'isOpenBook', 'record'],
    },
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
    AssessmentRecord: {
      type: 'object',
      properties: {
        battery: {
          $ref: '#/$defs/ScalarBattery',
        },
        series: {
          $ref: '#/$defs/ScalarSeries',
        },
        register: {
          $ref: '#/$defs/ScalarRegister',
        },
      },
      required: ['battery', 'series', 'register'],
    },
    Book: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
        },
        name: {
          $ref: '#/$defs/BookName',
        },
        isbn: {
          type: 'string',
        },
        edition: {
          type: 'integer',
          minimum: 0,
          maximum: 255,
        },
        pageCount: {
          type: 'integer',
          minimum: 0,
          maximum: 65535,
        },
        price: {
          type: 'number',
          $comment:
            'System.Decimal. Written as an unquoted JSON number with its scale preserved; a reader backed by an IEEE-754 double cannot hold it exactly.',
        },
        publishedOn: {
          type: 'string',
          format: 'date',
        },
        hasDigitalLicence: {
          type: 'boolean',
        },
        class: {
          anyOf: [
            {
              $ref: '#/$defs/Class',
            },
            {
              type: 'null',
            },
          ],
        },
        authors: {
          type: 'array',
          items: {
            $ref: '#/$defs/Person',
          },
        },
        chapters: {
          type: 'array',
          items: {
            $ref: '#/$defs/Chapter',
          },
        },
      },
      required: ['id', 'name', 'isbn', 'edition', 'pageCount', 'price', 'publishedOn', 'hasDigitalLicence', 'authors', 'chapters'],
    },
    BookName: {
      type: 'integer',
      $comment:
        'Cornerstone.Fixtures.Schema.Enums.BookName (System.Int32). System.Text.Json writes the numeric value here; as a dictionary key the same type is written as the member name instead.',
      oneOf: [
        {
          const: 0,
          title: 'PrinciplesOfAlgebra',
        },
        {
          const: 1,
          title: 'EuclideanFoundations',
        },
        {
          const: 2,
          title: 'CalculusInMotion',
        },
        {
          const: 3,
          title: 'StatisticsForTheCurious',
        },
        {
          const: 4,
          title: 'TheLivingCell',
        },
        {
          const: 5,
          title: 'ElementsAndReactions',
        },
        {
          const: 6,
          title: 'MechanicsAndMotion',
        },
        {
          const: 7,
          title: 'StructuredProgramming',
        },
        {
          const: 8,
          title: 'IntroductionToRobotics',
        },
        {
          const: 9,
          title: 'FieldGuideToTheNightSky',
        },
        {
          const: 10,
          title: 'AtlasOfCivilizations',
        },
        {
          const: 11,
          title: 'MapsAndMeridians',
        },
        {
          const: 12,
          title: 'AnAnthologyOfVerse',
        },
        {
          const: 13,
          title: 'TheWritersToolkit',
        },
        {
          const: 14,
          title: 'LinguaLatinaPrimer',
        },
        {
          const: 15,
          title: 'DialoguesOnReason',
        },
        {
          const: 16,
          title: 'MarketsAndScarcity',
        },
        {
          const: 17,
          title: 'HarmonyAndCounterpoint',
        },
        {
          const: 18,
          title: 'ColourAndComposition',
        },
        {
          const: 19,
          title: 'FoundationsOfKinesiology',
        },
      ],
    },
    Building: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
        },
        name: {
          type: 'string',
        },
        floorCount: {
          type: 'integer',
          minimum: -32768,
          maximum: 32767,
        },
        isAccessible: {
          type: 'boolean',
        },
        builtInYear: {
          type: 'integer',
          minimum: 0,
          maximum: 65535,
        },
        rooms: {
          type: 'array',
          items: {
            $ref: '#/$defs/Room',
          },
        },
      },
      required: ['id', 'name', 'floorCount', 'isAccessible', 'builtInYear', 'rooms'],
    },
    Campus: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
        },
        name: {
          type: 'string',
        },
        address: {
          $ref: '#/$defs/Address',
        },
        openedOn: {
          type: 'string',
          format: 'date',
        },
        areaHectares: {
          type: 'number',
        },
        buildings: {
          type: 'array',
          items: {
            $ref: '#/$defs/Building',
          },
        },
      },
      required: ['id', 'name', 'address', 'openedOn', 'areaHectares', 'buildings'],
    },
    Chapter: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
        },
        ordinal: {
          type: 'integer',
          minimum: -2147483648,
          maximum: 2147483647,
        },
        title: {
          type: 'string',
        },
        startPage: {
          type: 'integer',
          minimum: 0,
          maximum: 65535,
        },
        estimatedReadingTime: {
          type: 'string',
          pattern: '^-?(\\d+\\.)?\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,7})?$',
          $comment: 'System.TimeSpan. System.Text.Json writes [-][d.]hh:mm:ss[.fffffff], not an ISO-8601 duration, so the "duration" format does not hold.',
        },
        sections: {
          type: 'array',
          items: {
            $ref: '#/$defs/Section',
          },
        },
        subChapters: {
          type: 'array',
          items: {
            $ref: '#/$defs/Chapter',
          },
        },
      },
      required: ['id', 'ordinal', 'title', 'startPage', 'estimatedReadingTime', 'sections', 'subChapters'],
    },
    Class: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
        },
        name: {
          $ref: '#/$defs/ClassName',
        },
        code: {
          type: 'string',
        },
        term: {
          $ref: '#/$defs/Term',
        },
        academicYear: {
          type: 'integer',
          minimum: 0,
          maximum: 65535,
        },
        credits: {
          type: 'number',
        },
        seats: {
          type: 'integer',
          minimum: 0,
          maximum: 255,
        },
        isEnrollmentOpen: {
          type: 'boolean',
        },
        synopsis: {
          type: 'string',
        },
        professor: {
          anyOf: [
            {
              $ref: '#/$defs/Person',
            },
            {
              type: 'null',
            },
          ],
        },
        students: {
          type: 'array',
          items: {
            $ref: '#/$defs/Person',
          },
        },
        materials: {
          type: 'array',
          items: {
            $ref: '#/$defs/Book',
          },
        },
        prerequisites: {
          type: 'array',
          items: {
            $ref: '#/$defs/Class',
          },
        },
        schedule: {
          type: 'array',
          items: {
            $ref: '#/$defs/ClassSession',
          },
        },
        assessments: {
          type: 'array',
          items: {
            $ref: '#/$defs/Assessment',
          },
        },
        room: {
          anyOf: [
            {
              $ref: '#/$defs/Room',
            },
            {
              type: 'null',
            },
          ],
        },
      },
      required: [
        'id',
        'name',
        'code',
        'term',
        'academicYear',
        'credits',
        'seats',
        'isEnrollmentOpen',
        'synopsis',
        'students',
        'materials',
        'prerequisites',
        'schedule',
        'assessments',
      ],
    },
    ClassName: {
      type: 'integer',
      $comment:
        'Cornerstone.Fixtures.Schema.Enums.ClassName (System.Int32). System.Text.Json writes the numeric value here; as a dictionary key the same type is written as the member name instead.',
      oneOf: [
        {
          const: 0,
          title: 'Algebra',
        },
        {
          const: 1,
          title: 'Geometry',
        },
        {
          const: 2,
          title: 'Calculus',
        },
        {
          const: 3,
          title: 'Statistics',
        },
        {
          const: 4,
          title: 'Biology',
        },
        {
          const: 5,
          title: 'Chemistry',
        },
        {
          const: 6,
          title: 'Physics',
        },
        {
          const: 7,
          title: 'ComputerScience',
        },
        {
          const: 8,
          title: 'Robotics',
        },
        {
          const: 9,
          title: 'Astronomy',
        },
        {
          const: 10,
          title: 'WorldHistory',
        },
        {
          const: 11,
          title: 'Geography',
        },
        {
          const: 12,
          title: 'Literature',
        },
        {
          const: 13,
          title: 'CreativeWriting',
        },
        {
          const: 14,
          title: 'Latin',
        },
        {
          const: 15,
          title: 'Philosophy',
        },
        {
          const: 16,
          title: 'Economics',
        },
        {
          const: 17,
          title: 'MusicTheory',
        },
        {
          const: 18,
          title: 'VisualArts',
        },
        {
          const: 19,
          title: 'PhysicalEducation',
        },
      ],
    },
    ClassSession: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
        },
        day: {
          $ref: '#/$defs/DayOfWeek',
        },
        startsAt: {
          type: 'string',
          pattern: '^([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(\\.\\d{1,7})?$',
          $comment:
            'System.TimeOnly. System.Text.Json writes hh:mm:ss[.fffffff] with no UTC offset, so the JSON Schema "time" format (RFC 3339 full-time) does not hold.',
        },
        duration: {
          type: 'string',
          pattern: '^-?(\\d+\\.)?\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,7})?$',
          $comment: 'System.TimeSpan. System.Text.Json writes [-][d.]hh:mm:ss[.fffffff], not an ISO-8601 duration, so the "duration" format does not hold.',
        },
        isRemote: {
          type: 'boolean',
        },
        room: {
          anyOf: [
            {
              $ref: '#/$defs/Room',
            },
            {
              type: 'null',
            },
          ],
        },
      },
      required: ['id', 'day', 'startsAt', 'duration', 'isRemote'],
    },
    DayOfWeek: {
      type: 'integer',
      $comment:
        'System.DayOfWeek (System.Int32). System.Text.Json writes the numeric value here; as a dictionary key the same type is written as the member name instead.',
      oneOf: [
        {
          const: 0,
          title: 'Sunday',
        },
        {
          const: 1,
          title: 'Monday',
        },
        {
          const: 2,
          title: 'Tuesday',
        },
        {
          const: 3,
          title: 'Wednesday',
        },
        {
          const: 4,
          title: 'Thursday',
        },
        {
          const: 5,
          title: 'Friday',
        },
        {
          const: 6,
          title: 'Saturday',
        },
      ],
    },
    Department: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
        },
        name: {
          $ref: '#/$defs/DepartmentName',
        },
        costCentre: {
          type: 'string',
        },
        annualBudget: {
          type: 'number',
          $comment:
            'System.Decimal. Written as an unquoted JSON number with its scale preserved; a reader backed by an IEEE-754 double cannot hold it exactly.',
        },
        establishedOn: {
          type: 'string',
          format: 'date',
        },
        head: {
          anyOf: [
            {
              $ref: '#/$defs/Person',
            },
            {
              type: 'null',
            },
          ],
        },
        courses: {
          type: 'array',
          items: {
            $ref: '#/$defs/Class',
          },
        },
        subDepartments: {
          type: 'array',
          items: {
            $ref: '#/$defs/Department',
          },
        },
      },
      required: ['id', 'name', 'costCentre', 'annualBudget', 'establishedOn', 'courses', 'subDepartments'],
    },
    DepartmentName: {
      type: 'integer',
      $comment:
        'Cornerstone.Fixtures.Schema.Enums.DepartmentName (System.Int32). System.Text.Json writes the numeric value here; as a dictionary key the same type is written as the member name instead.',
      oneOf: [
        {
          const: 0,
          title: 'Mathematics',
        },
        {
          const: 1,
          title: 'NaturalSciences',
        },
        {
          const: 2,
          title: 'ComputerScience',
        },
        {
          const: 3,
          title: 'Humanities',
        },
        {
          const: 4,
          title: 'SocialSciences',
        },
        {
          const: 5,
          title: 'Arts',
        },
        {
          const: 6,
          title: 'Athletics',
        },
        {
          const: 7,
          title: 'ContinuingEducation',
        },
      ],
    },
    Exercise: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
        },
        label: {
          type: 'string',
        },
        prompt: {
          type: 'string',
        },
        difficulty: {
          type: 'number',
        },
        hasWorkedSolution: {
          type: 'boolean',
        },
        marks: {
          type: 'integer',
          minimum: 0,
          maximum: 255,
        },
      },
      required: ['id', 'label', 'prompt', 'difficulty', 'hasWorkedSolution', 'marks'],
    },
    Library: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
        },
        name: {
          type: 'string',
        },
        volumeCount: {
          type: 'integer',
          minimum: 0,
          maximum: 4294967295,
        },
        opensAt: {
          type: 'string',
          pattern: '^([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(\\.\\d{1,7})?$',
          $comment:
            'System.TimeOnly. System.Text.Json writes hh:mm:ss[.fffffff] with no UTC offset, so the JSON Schema "time" format (RFC 3339 full-time) does not hold.',
        },
        closesAt: {
          type: 'string',
          pattern: '^([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(\\.\\d{1,7})?$',
          $comment:
            'System.TimeOnly. System.Text.Json writes hh:mm:ss[.fffffff] with no UTC offset, so the JSON Schema "time" format (RFC 3339 full-time) does not hold.',
        },
        catalogue: {
          type: 'object',
          $comment:
            "Keyed by Cornerstone.Fixtures.Schema.Enums.BookName. System.Text.Json writes an enum dictionary key as the member name even under the default numeric converter, so this differs from the enum's value form.",
          propertyNames: {
            type: 'string',
            enum: [
              'PrinciplesOfAlgebra',
              'EuclideanFoundations',
              'CalculusInMotion',
              'StatisticsForTheCurious',
              'TheLivingCell',
              'ElementsAndReactions',
              'MechanicsAndMotion',
              'StructuredProgramming',
              'IntroductionToRobotics',
              'FieldGuideToTheNightSky',
              'AtlasOfCivilizations',
              'MapsAndMeridians',
              'AnAnthologyOfVerse',
              'TheWritersToolkit',
              'LinguaLatinaPrimer',
              'DialoguesOnReason',
              'MarketsAndScarcity',
              'HarmonyAndCounterpoint',
              'ColourAndComposition',
              'FoundationsOfKinesiology',
            ],
          },
          additionalProperties: {
            $ref: '#/$defs/Book',
          },
        },
        librarians: {
          type: 'array',
          items: {
            $ref: '#/$defs/Person',
          },
        },
        readingRooms: {
          type: 'array',
          items: {
            $ref: '#/$defs/Room',
          },
        },
      },
      required: ['id', 'name', 'volumeCount', 'opensAt', 'closesAt', 'catalogue', 'librarians', 'readingRooms'],
    },
    Person: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
        },
        givenName: {
          type: 'string',
        },
        familyName: {
          type: 'string',
        },
        role: {
          $ref: '#/$defs/PersonRole',
        },
        bornOn: {
          type: 'string',
          format: 'date',
        },
        email: {
          type: 'string',
        },
        isActive: {
          type: 'boolean',
        },
        gradePointAverage: {
          type: 'number',
        },
        classes: {
          type: 'array',
          items: {
            $ref: '#/$defs/Class',
          },
        },
        grades: {
          type: 'object',
          $comment:
            "Keyed by Cornerstone.Fixtures.Schema.Enums.ClassName. System.Text.Json writes an enum dictionary key as the member name even under the default numeric converter, so this differs from the enum's value form.",
          propertyNames: {
            type: 'string',
            enum: [
              'Algebra',
              'Geometry',
              'Calculus',
              'Statistics',
              'Biology',
              'Chemistry',
              'Physics',
              'ComputerScience',
              'Robotics',
              'Astronomy',
              'WorldHistory',
              'Geography',
              'Literature',
              'CreativeWriting',
              'Latin',
              'Philosophy',
              'Economics',
              'MusicTheory',
              'VisualArts',
              'PhysicalEducation',
            ],
          },
          additionalProperties: {
            type: 'integer',
            minimum: -2147483648,
            maximum: 2147483647,
          },
        },
        contactMethods: {
          type: 'object',
          additionalProperties: {
            type: 'string',
          },
        },
        mentor: {
          anyOf: [
            {
              $ref: '#/$defs/Person',
            },
            {
              type: 'null',
            },
          ],
        },
        advisees: {
          type: 'array',
          items: {
            $ref: '#/$defs/Person',
          },
        },
        office: {
          anyOf: [
            {
              $ref: '#/$defs/Room',
            },
            {
              type: 'null',
            },
          ],
        },
      },
      required: [
        'id',
        'givenName',
        'familyName',
        'role',
        'bornOn',
        'email',
        'isActive',
        'gradePointAverage',
        'classes',
        'grades',
        'contactMethods',
        'advisees',
      ],
    },
    PersonRole: {
      type: 'integer',
      $comment:
        'Cornerstone.Fixtures.Schema.Enums.PersonRole (System.Int32). System.Text.Json writes the numeric value here; as a dictionary key the same type is written as the member name instead.',
      oneOf: [
        {
          const: 0,
          title: 'Student',
        },
        {
          const: 1,
          title: 'Professor',
        },
        {
          const: 2,
          title: 'TeachingAssistant',
        },
        {
          const: 3,
          title: 'Librarian',
        },
        {
          const: 4,
          title: 'Counsellor',
        },
        {
          const: 5,
          title: 'Administrator',
        },
      ],
    },
    Room: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
        },
        code: {
          type: 'string',
        },
        kind: {
          $ref: '#/$defs/RoomKind',
        },
        seats: {
          type: 'integer',
          minimum: 0,
          maximum: 65535,
        },
        floor: {
          type: 'integer',
          minimum: -128,
          maximum: 127,
        },
        classes: {
          type: 'array',
          items: {
            $ref: '#/$defs/Class',
          },
        },
      },
      required: ['id', 'code', 'kind', 'seats', 'floor', 'classes'],
    },
    RoomKind: {
      type: 'integer',
      $comment:
        'Cornerstone.Fixtures.Schema.Enums.RoomKind (System.Int32). System.Text.Json writes the numeric value here; as a dictionary key the same type is written as the member name instead.',
      oneOf: [
        {
          const: 0,
          title: 'LectureHall',
        },
        {
          const: 1,
          title: 'Classroom',
        },
        {
          const: 2,
          title: 'Laboratory',
        },
        {
          const: 3,
          title: 'SeminarRoom',
        },
        {
          const: 4,
          title: 'Studio',
        },
        {
          const: 5,
          title: 'Workshop',
        },
        {
          const: 6,
          title: 'Gymnasium',
        },
        {
          const: 7,
          title: 'ReadingRoom',
        },
        {
          const: 8,
          title: 'Auditorium',
        },
      ],
    },
    ScalarBattery: {
      type: 'object',
      properties: {
        isProctored: {
          type: 'boolean',
        },
        curveAdjustment: {
          type: 'integer',
          minimum: -128,
          maximum: 127,
        },
        rawScore: {
          type: 'integer',
          minimum: 0,
          maximum: 255,
        },
        seatNumber: {
          type: 'integer',
          minimum: -32768,
          maximum: 32767,
        },
        itemCount: {
          type: 'integer',
          minimum: 0,
          maximum: 65535,
        },
        totalPoints: {
          type: 'integer',
          minimum: -2147483648,
          maximum: 2147483647,
        },
        submissionSequence: {
          type: 'integer',
          minimum: 0,
          maximum: 4294967295,
        },
        elapsedTicks: {
          type: 'integer',
          $comment:
            'System.Int64. Bounds are omitted: they are not exactly representable in IEEE-754, and values beyond 2^53 lose precision in readers that parse JSON numbers as doubles.',
        },
        integrityChecksum: {
          type: 'integer',
          minimum: 0,
          $comment: 'System.UInt64. The upper bound is omitted: it is not exactly representable in IEEE-754.',
        },
        percentileRank: {
          type: 'number',
        },
        scaledScore: {
          type: 'number',
        },
        weightedAverage: {
          type: 'number',
          $comment:
            'System.Decimal. Written as an unquoted JSON number with its scale preserved; a reader backed by an IEEE-754 double cannot hold it exactly.',
        },
        letterGrade: {
          type: 'string',
          minLength: 1,
          maxLength: 1,
        },
        remarks: {
          type: 'string',
        },
        responseId: {
          type: 'string',
          format: 'uuid',
        },
        administeredOn: {
          type: 'string',
          format: 'date',
        },
        startedAt: {
          type: 'string',
          pattern: '^([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(\\.\\d{1,7})?$',
          $comment:
            'System.TimeOnly. System.Text.Json writes hh:mm:ss[.fffffff] with no UTC offset, so the JSON Schema "time" format (RFC 3339 full-time) does not hold.',
        },
        allowedDuration: {
          type: 'string',
          pattern: '^-?(\\d+\\.)?\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,7})?$',
          $comment: 'System.TimeSpan. System.Text.Json writes [-][d.]hh:mm:ss[.fffffff], not an ISO-8601 duration, so the "duration" format does not hold.',
        },
        recordedAtUtc: {
          type: 'string',
          format: 'date-time',
          $comment:
            'System.DateTime. The offset suffix is present only when DateTimeKind is Utc or Local; a DateTimeKind.Unspecified value is written without one and would not satisfy "date-time".',
        },
        submittedAt: {
          type: 'string',
          format: 'date-time',
        },
      },
      required: [
        'isProctored',
        'curveAdjustment',
        'rawScore',
        'seatNumber',
        'itemCount',
        'totalPoints',
        'submissionSequence',
        'elapsedTicks',
        'integrityChecksum',
        'percentileRank',
        'scaledScore',
        'weightedAverage',
        'letterGrade',
        'remarks',
        'responseId',
        'administeredOn',
        'startedAt',
        'allowedDuration',
        'recordedAtUtc',
        'submittedAt',
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
    ScalarSeries: {
      type: 'object',
      properties: {
        attemptedFlags: {
          type: 'array',
          items: {
            type: 'boolean',
          },
        },
        curveAdjustments: {
          type: 'array',
          items: {
            type: 'integer',
            minimum: -128,
            maximum: 127,
          },
        },
        rawScores: {
          type: 'array',
          items: {
            type: 'integer',
            minimum: 0,
            maximum: 255,
          },
        },
        seatNumbers: {
          type: 'array',
          items: {
            type: 'integer',
            minimum: -32768,
            maximum: 32767,
          },
        },
        attemptCounts: {
          type: 'array',
          items: {
            type: 'integer',
            minimum: 0,
            maximum: 65535,
          },
        },
        pointsPerItem: {
          type: 'array',
          items: {
            type: 'integer',
            minimum: -2147483648,
            maximum: 2147483647,
          },
        },
        submissionSequences: {
          type: 'array',
          items: {
            type: 'integer',
            minimum: 0,
            maximum: 4294967295,
          },
        },
        elapsedTicksPerItem: {
          type: 'array',
          items: {
            type: 'integer',
            $comment:
              'System.Int64. Bounds are omitted: they are not exactly representable in IEEE-754, and values beyond 2^53 lose precision in readers that parse JSON numbers as doubles.',
          },
        },
        integrityChecksums: {
          type: 'array',
          items: {
            type: 'integer',
            minimum: 0,
            $comment: 'System.UInt64. The upper bound is omitted: it is not exactly representable in IEEE-754.',
          },
        },
        percentileRanks: {
          type: 'array',
          items: {
            type: 'number',
          },
        },
        scaledScores: {
          type: 'array',
          items: {
            type: 'number',
          },
        },
        weightedAverages: {
          type: 'array',
          items: {
            type: 'number',
            $comment:
              'System.Decimal. Written as an unquoted JSON number with its scale preserved; a reader backed by an IEEE-754 double cannot hold it exactly.',
          },
        },
        letterGrades: {
          type: 'array',
          items: {
            type: 'string',
            minLength: 1,
            maxLength: 1,
          },
        },
        remarks: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        responseIds: {
          type: 'array',
          items: {
            type: 'string',
            format: 'uuid',
          },
        },
        markedOn: {
          type: 'array',
          items: {
            type: 'string',
            format: 'date',
          },
        },
        openedAt: {
          type: 'array',
          items: {
            type: 'string',
            pattern: '^([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(\\.\\d{1,7})?$',
            $comment:
              'System.TimeOnly. System.Text.Json writes hh:mm:ss[.fffffff] with no UTC offset, so the JSON Schema "time" format (RFC 3339 full-time) does not hold.',
          },
        },
        durations: {
          type: 'array',
          items: {
            type: 'string',
            pattern: '^-?(\\d+\\.)?\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,7})?$',
            $comment: 'System.TimeSpan. System.Text.Json writes [-][d.]hh:mm:ss[.fffffff], not an ISO-8601 duration, so the "duration" format does not hold.',
          },
        },
        recordedAtUtc: {
          type: 'array',
          items: {
            type: 'string',
            format: 'date-time',
            $comment:
              'System.DateTime. The offset suffix is present only when DateTimeKind is Utc or Local; a DateTimeKind.Unspecified value is written without one and would not satisfy "date-time".',
          },
        },
        savedAt: {
          type: 'array',
          items: {
            type: 'string',
            format: 'date-time',
          },
        },
        answerSheetScan: {
          type: 'array',
          items: {
            type: 'integer',
            minimum: 0,
            maximum: 255,
          },
        },
      },
      required: [
        'attemptedFlags',
        'curveAdjustments',
        'rawScores',
        'seatNumbers',
        'attemptCounts',
        'pointsPerItem',
        'submissionSequences',
        'elapsedTicksPerItem',
        'integrityChecksums',
        'percentileRanks',
        'scaledScores',
        'weightedAverages',
        'letterGrades',
        'remarks',
        'responseIds',
        'markedOn',
        'openedAt',
        'durations',
        'recordedAtUtc',
        'savedAt',
        'answerSheetScan',
      ],
    },
    School: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
        },
        name: {
          type: 'string',
        },
        motto: {
          type: 'string',
        },
        foundedOn: {
          type: 'string',
          format: 'date',
        },
        isAccredited: {
          type: 'boolean',
        },
        enrollmentCap: {
          type: 'integer',
          minimum: 0,
          maximum: 65535,
        },
        endowment: {
          type: 'number',
          $comment:
            'System.Decimal. Written as an unquoted JSON number with its scale preserved; a reader backed by an IEEE-754 double cannot hold it exactly.',
        },
        campuses: {
          type: 'array',
          items: {
            $ref: '#/$defs/Campus',
          },
        },
        departments: {
          type: 'object',
          $comment:
            "Keyed by Cornerstone.Fixtures.Schema.Enums.DepartmentName. System.Text.Json writes an enum dictionary key as the member name even under the default numeric converter, so this differs from the enum's value form.",
          propertyNames: {
            type: 'string',
            enum: ['Mathematics', 'NaturalSciences', 'ComputerScience', 'Humanities', 'SocialSciences', 'Arts', 'Athletics', 'ContinuingEducation'],
          },
          additionalProperties: {
            $ref: '#/$defs/Department',
          },
        },
        library: {
          anyOf: [
            {
              $ref: '#/$defs/Library',
            },
            {
              type: 'null',
            },
          ],
        },
        sisterSchools: {
          type: 'array',
          items: {
            $ref: '#/$defs/School',
          },
        },
      },
      required: ['id', 'name', 'motto', 'foundedOn', 'isAccredited', 'enrollmentCap', 'endowment', 'campuses', 'departments', 'sisterSchools'],
    },
    Section: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
        },
        number: {
          type: 'string',
        },
        heading: {
          type: 'string',
        },
        body: {
          type: 'string',
        },
        wordCount: {
          type: 'integer',
          minimum: -2147483648,
          maximum: 2147483647,
        },
        exercises: {
          type: 'array',
          items: {
            $ref: '#/$defs/Exercise',
          },
        },
      },
      required: ['id', 'number', 'heading', 'body', 'wordCount', 'exercises'],
    },
    Term: {
      type: 'integer',
      $comment:
        'Cornerstone.Fixtures.Schema.Enums.Term (System.Int32). System.Text.Json writes the numeric value here; as a dictionary key the same type is written as the member name instead.',
      oneOf: [
        {
          const: 0,
          title: 'Autumn',
        },
        {
          const: 1,
          title: 'Winter',
        },
        {
          const: 2,
          title: 'Spring',
        },
        {
          const: 3,
          title: 'Summer',
        },
      ],
    },
  },
} as const;
