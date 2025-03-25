/*
  # Add model parameters to AI configurations

  1. New Columns
    - `max_length`: Maximum length of generated response
    - `top_p`: Nucleus sampling parameter
    - `top_k`: Top-k sampling parameter
    - `frequency_penalty`: Penalty for token frequency
    - `presence_penalty`: Penalty for token presence
    - `stop_sequences`: Array of stop sequences
    - `system_prompt`: Default system prompt for the model
*/

ALTER TABLE ai_config
  ADD COLUMN max_length int DEFAULT 2048,
  ADD COLUMN top_p float DEFAULT 0.9,
  ADD COLUMN top_k int DEFAULT 50,
  ADD COLUMN frequency_penalty float DEFAULT 0.0,
  ADD COLUMN presence_penalty float DEFAULT 0.0,
  ADD COLUMN stop_sequences text DEFAULT '[]',
  ADD COLUMN system_prompt text;