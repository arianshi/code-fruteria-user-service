export class SerializableError extends Error {
  code: number = 0
  description?: string

  constructor(message: string, code: number, description?: string) {
    super(message)
    this.code = code
    this.description = description
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      description: this.description,
    }
  }
}

export class NonCriticalError extends Error {}
