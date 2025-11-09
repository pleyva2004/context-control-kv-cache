# dependencies

find_package(Threads REQUIRED)

# third-party

# ...

# flags

llama_add_compile_flags()

# tools

if (EMSCRIPTEN)
else()
    # add_subdirectory(batched-bench)  # disabled - directory does not exist
    # add_subdirectory(gguf-split)  # disabled - directory does not exist
    # add_subdirectory(imatrix)  # disabled - directory does not exist
    # add_subdirectory(llama-bench)  # disabled - directory does not exist
    # add_subdirectory(main)  # disabled - directory does not exist
    # add_subdirectory(perplexity)  # disabled - directory does not exist
    # add_subdirectory(quantize)  # disabled - directory does not exist
    if (LLAMA_BUILD_SERVER)
        add_subdirectory(server)
    endif()
    # add_subdirectory(run)  # disabled - directory does not exist
    # add_subdirectory(tokenize)  # disabled - directory does not exist
    # add_subdirectory(tts)  # disabled - directory does not exist
    add_subdirectory(mtmd)
    if (GGML_RPC)
        # add_subdirectory(rpc)  # disabled - directory does not exist
    endif()
    if (NOT GGML_BACKEND_DL)
        # these examples use the backends directly and cannot be built with dynamic loading
        # add_subdirectory(cvector-generator)  # disabled - directory does not exist
        # add_subdirectory(export-lora)  # disabled - directory does not exist
    endif()
endif()
